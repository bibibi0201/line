#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP8266HTTPClient.h>

const char* ssid = "arwen.net";
const char* password = "arwen2015";
const char* firebaseHost = "fir-b5ac2-default-rtdb.asia-southeast1.firebasedatabase.app/";
const char* getPath = "/command.json";

const int ledPin = LED_BUILTIN ;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void loop() {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  String url = String("https://") + firebaseHost + getPath;
  http.begin(client, url);
  int httpCode = http.GET();

  if (httpCode > 0) {
    String ledStatus = http.getString();
    Serial.println("LED = " + ledStatus);
    if (ledStatus.indexOf("on") >= 0) {
      digitalWrite(ledPin, LOW);
    } else {
      digitalWrite(ledPin, HIGH);
    }
  } else {
    Serial.println("Error: " + http.errorToString(httpCode));
  }

  http.end();
  delay(1000);
} 

