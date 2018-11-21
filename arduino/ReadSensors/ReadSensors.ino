#include "OneWire.h"
#include "DFRobot_PH.h"
#include <EEPROM.h>

typedef union {
  float f;
  byte b[4];
} binaryFloat;

// Temp sensor variables
#define TempSensorPin 4
OneWire ds(TempSensorPin);
binaryFloat temperature;

// TDS sensor variables
#define TdsSensorPin A0
#define VREF 5.0      // analog reference voltage(Volt) of the ADC
#define SCOUNT  20           // sum of sample point
int analogBuffer[SCOUNT];    // store the analog value in the array, read from ADC
int analogBufferTemp[SCOUNT];
int analogBufferIndex = 0,copyIndex = 0;
float averageVoltage = 0;
binaryFloat tdsValue;

// Turbidity sensor variables
#define TurbSensorPin A5
int turbSensorValue = 0;
float turbVoltage = 0;
binaryFloat turbValue;

// pH sensor variables
#define phSensorPin A2
float phVoltage;
binaryFloat phValue;
DFRobot_PH ph;

// ORP sensor variables
#define VOLTAGE 5.00     //system voltage
#define OFFSET 22        //zero drift voltage
#define ArrayLenth 20    //times of collection
#define orpPin A3        //orp meter output,connect to Arduino controller ADC pin
int orpArray[ArrayLenth];
int orpArrayIndex=0;
binaryFloat orpValue;

void setup() {
  Serial.begin(115200);
  pinMode(TdsSensorPin, INPUT);
  pinMode(TurbSensorPin, INPUT);
  ph.begin();
}

void loop() {
  if (Serial.read() == 1)  {
    Serial.write(temperature.b, 4);
    Serial.write(tdsValue.b, 4);
    Serial.write(turbValue.b, 4);
    Serial.write(phValue.b, 4);
    Serial.write(orpValue.b, 4);
  }
  static unsigned long analogSampleTimepoint = millis();
  if(millis()-analogSampleTimepoint > 40U)     // every 40 milliseconds read values
  {
    // temperature
    temperature.f = readTemp();

    // turbidity
    turbSensorValue = analogRead(TurbSensorPin);
    turbVoltage = turbSensorValue * (5.0/1024.0);
    turbValue.f = turbVoltage;

    // TDS
    analogSampleTimepoint = millis();
    analogBuffer[analogBufferIndex] = analogRead(TdsSensorPin);    //read the analog value and store into the buffer
    analogBufferIndex++;
    if(analogBufferIndex == SCOUNT) // update TDS value
    {
      for(copyIndex=0;copyIndex<SCOUNT;copyIndex++)
        analogBufferTemp[copyIndex]= analogBuffer[copyIndex];
      averageVoltage = getMedianNum(analogBufferTemp,SCOUNT) * (float)VREF / 1024.0; // read the analog value more stable by the median filtering algorithm, and convert to voltage value
      float compensationCoefficient=1.0+0.02*(temperature.f-25.0);    //temperature compensation formula: fFinalResult(25^C) = fFinalResult(current)/(1.0+0.02*(fTP-25.0));
      float compensationVoltage=averageVoltage/compensationCoefficient;  //temperature compensation
      tdsValue.f=(133.42*compensationVoltage*compensationVoltage*compensationVoltage - 255.86*compensationVoltage*compensationVoltage + 857.39*compensationVoltage)*0.5; //convert voltage value to tds value
      analogBufferIndex = 0;
    }

    // pH
    phVoltage = analogRead(phSensorPin)/1024.0*5000;
    phValue.f = ph.readPH(phVoltage,temperature.f);

    // ORP
    orpArray[orpArrayIndex++]=analogRead(orpPin);
    if (orpArrayIndex==ArrayLenth) // update ORP value
    {
      orpValue.f=((30*(double)VOLTAGE*1000)-(75*avergearray(orpArray, ArrayLenth)*VOLTAGE*1000/1024))/75-OFFSET;   //convert the analog value to orp according the circuit
      orpArrayIndex=0;
    }
  }   

  
//  static unsigned long printTimepoint = millis();
//  if(millis()-printTimepoint > 800U)    // every 800 milliseconds print values
//  {
//    printTimepoint = millis();
//    
//    
//    
//    Serial.print("Temp: ");
//    Serial.print(temperature.f, 2);
//    Serial.print(" TDS: ");
//    Serial.println(tdsValue.f, 2);
//    Serial.print(" Turb: ");
//    Serial.println(turbVoltage);
//    Serial.print(" pH: ");
//    Serial.println(phValue.f);
//    Serial.print(" ORP: ");
//    Serial.println(orpValue.f);
//  }
}

//////// helper functions ////////

// returns the temperature in Celsius
float readTemp(){

  byte data[12];
  byte addr[8];

  if ( !ds.search(addr)) {
      //no more sensors on chain, reset search
      ds.reset_search();
      return -1000;
  }

  if ( OneWire::crc8( addr, 7) != addr[7]) {
      Serial.println("CRC is not valid!");
      return -1000;
  }

  if ( addr[0] != 0x10 && addr[0] != 0x28) {
      Serial.print("Device is not recognized");
      return -1000;
  }

  ds.reset();
  ds.select(addr);
  ds.write(0x44,1); // start conversion, with parasite power on at the end

  byte present = ds.reset();
  ds.select(addr);    
  ds.write(0xBE); // Read Scratchpad

  
  for (int i = 0; i < 9; i++) { // we need 9 bytes
    data[i] = ds.read();
  }
  
  ds.reset_search();
  
  byte MSB = data[1];
  byte LSB = data[0];

  float tempRead = ((MSB << 8) | LSB); //using two's compliment
  float TemperatureSum = tempRead / 16;
  
  return TemperatureSum;
  
}

int getMedianNum(int bArray[], int iFilterLen) 
{
      int bTab[iFilterLen];
      for (byte i = 0; i<iFilterLen; i++)
    bTab[i] = bArray[i];
      int i, j, bTemp;
      for (j = 0; j < iFilterLen - 1; j++) 
      {
    for (i = 0; i < iFilterLen - j - 1; i++) 
          {
      if (bTab[i] > bTab[i + 1]) 
            {
    bTemp = bTab[i];
          bTab[i] = bTab[i + 1];
    bTab[i + 1] = bTemp;
       }
    }
      }
      if ((iFilterLen & 1) > 0)
  bTemp = bTab[(iFilterLen - 1) / 2];
      else
  bTemp = (bTab[iFilterLen / 2] + bTab[iFilterLen / 2 - 1]) / 2;
      return bTemp;
}

double avergearray(int* arr, int number){
  int i;
  int max,min;
  double avg;
  long amount=0;
  if(number<=0){
    printf("Error number for the array to avraging!/n");
    return 0;
  }
  if(number<5){   //less than 5, calculated directly statistics
    for(i=0;i<number;i++){
      amount+=arr[i];
    }
    avg = amount/number;
    return avg;
  }else{
    if(arr[0]<arr[1]){
      min = arr[0];max=arr[1];
    }
    else{
      min=arr[1];max=arr[0];
    }
    for(i=2;i<number;i++){
      if(arr[i]<min){
        amount+=min;        //arr<min
        min=arr[i];
      }else {
        if(arr[i]>max){
          amount+=max;    //arr>max
          max=arr[i];
        }else{
          amount+=arr[i]; //min<=arr<=max
        }
      }//if
    }//for
    avg = (double)amount/(number-2);
  }//if
  return avg;
}
