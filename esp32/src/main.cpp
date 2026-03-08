#include "Arduino.h"
#include <SPI.h>
#include <SoftwareSerial.h>
#include <PN532_SWHSU.h>
#include <PN532.h>
#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <GxEPD2_BW.h>
#include <GxEPD2_3C.h>
#include <Fonts/FreeMonoBold9pt7b.h>
#include <ArduinoJson.h>

WiFiClient wifiClient;
SoftwareSerial SWSerial(D6, D4); // RX=D6 (GPIO12), TX=D4 (GPIO2) for PN532 HSU - pines seguros
PN532_SWHSU pn532swhsu(SWSerial);
PN532 nfc(pn532swhsu);

// E-paper 3.13" Waveshare pins (SPI hardware)
// SCL (clock) -> D5 (GPIO14, hardware SCLK)
// SDA (MOSI)  -> D7 (GPIO13, hardware MOSI)
#define EPD_CS D1    // GPIO5 - Chip Select
#define EPD_DC D2    // GPIO4 - Data/Command  
#define EPD_RST D0   // GPIO16 - Reset
#define EPD_BUSY D8  // GPIO15 - Busy

// 2.13" WeAct e-paper (GxEPD2 driver)
GxEPD2_BW<GxEPD2_213_B74, GxEPD2_213_B74::HEIGHT> display(GxEPD2_213_B74(EPD_CS, EPD_DC, EPD_RST, EPD_BUSY));

const char* ssid = "redDiconsa";
const char* password = "tiendadiconsa72.";
const char* serverUrl = "http://192.168.6.125:3000/api/v1/asistencias";

void drawStatus(const char* line1, const char* line2, const char* line3)
{
  display.setRotation(1);
  display.setFullWindow();
  display.firstPage();
  do {
    display.fillScreen(GxEPD_WHITE);
    display.setTextColor(GxEPD_BLACK);
    display.setFont(&FreeMonoBold9pt7b);
    display.setCursor(10, 20);
    display.println(line1);
    display.setCursor(10, 45);
    display.println(line2);
    display.setCursor(10, 70);
    display.println(line3);
  } while (display.nextPage());
  
  // Importante: dar tiempo a la pantalla para completar el refresh
  display.hibernate();
  delay(100); // Pequeño delay para asegurar que la pantalla se actualice
}

String uidToHex(uint8_t *uid, uint8_t uidLength)
{
  String s = "";
  for (uint8_t i = 0; i < uidLength; i++) {
    if (uid[i] < 0x10) s += "0";
    s += String(uid[i], HEX);
  }
  s.toUpperCase();
  return s;
}

void setup(void) {
  delay(1000);
  Serial.begin(74880);
  Serial.println("\n\n=== Sistema Iniciando ===");
  
  display.init();
  drawStatus("Iniciando...", "Sistema", "Arrancando");
  
  drawStatus("WiFi", "Conectando...", ssid);
  WiFi.begin(ssid, password);
  for (int i = 0; i < 10; i++) {
    delay(500);
    if (WiFi.status() == WL_CONNECTED) break;
  }
  if (WiFi.status() == WL_CONNECTED) {
    String ip = WiFi.localIP().toString();
    drawStatus("WiFi OK", ip.c_str(), "Listo");
  } else {
    drawStatus("WiFi ERROR", "No conectado", "Revisar config");
  }
  
  drawStatus("NFC PN532", "Iniciando HSU", "D6/D4");
  SWSerial.begin(115200);
  nfc.begin();
  nfc.SAMConfig(); // Configurar para leer tarjetas
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (!versiondata) {
    drawStatus("NFC ERROR", "PN532 no", "detectado");
    delay(2000);
  } else {
    String fwver = String((versiondata>>16) & 0xFF) + "." + String((versiondata>>8) & 0xFF);
    String nfcMsg = "PN532 v" + fwver;
    drawStatus("NFC OK", nfcMsg.c_str(), "Listo");
  }
  
  drawStatus("Sistema Listo", "Esperando", "tarjeta NFC");
}

void loop(void) {
  uint8_t uid[7];
  uint8_t uidLength;
  
  // Esperar por una tarjeta NFC
  if (nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 1000)) {
    String uidHex = uidToHex(uid, uidLength);
    
    // Mostrar en display
    drawStatus("Tarjeta NFC", uidHex.c_str(), "Enviando...");
    delay(800); // Dar tiempo a que la pantalla e-paper complete el refresh
    
    // Enviar al servidor
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(wifiClient, serverUrl);
      http.addHeader("Content-Type", "application/json");
      
      String jsonPayload = "{\"uidTarjeta\":\"" + uidHex + "\"}";
      
      Serial.println("\n[HTTP] Enviando request...");
      Serial.println("URL: " + String(serverUrl));
      Serial.println("Payload: " + jsonPayload);
      
      int httpCode = http.POST(jsonPayload);
      
      Serial.println("[HTTP] Código de respuesta: " + String(httpCode));
      
      if (httpCode > 0) {
        String response = http.getString();
        Serial.println("[HTTP] Respuesta recibida:");
        Serial.println(response);
        Serial.println("---");
        
        if (httpCode == 204) {
          // Sin contenido - tag pasado en ventana de 30 seg o 2 min
          // Volver rápidamente al estado de espera sin mostrar mensaje
          Serial.println("[INFO] Respuesta 204 - Tag rechazado por ventana de tiempo");
          drawStatus("Sistema Listo", "Esperando", "tarjeta NFC");
          delay(1000); // Delay corto para siguiente lectura
          http.end();
          return; // Salir del loop para evitar el delay de 5 segundos
        } else if (httpCode == 200 || httpCode == 201) {
          // Parsear respuesta JSON
          StaticJsonDocument<512> doc;
          DeserializationError error = deserializeJson(doc, response);
          
          if (!error) {
            // Verificar si la respuesta es válida
            if (doc.containsKey("ok") && doc["ok"] == true && doc.containsKey("data")) {
              // Extraer datos con verificación
              const char* nombrePtr = doc["data"]["nombre"];
              const char* tipoPtr = doc["data"]["tipo"];
              const char* horaPtr = doc["data"]["hora"];
              
              String nombre = nombrePtr ? String(nombrePtr) : "Alumno";
              String tipo = tipoPtr ? String(tipoPtr) : "entrada";
              String hora = horaPtr ? String(horaPtr) : "";
              
              Serial.println("[INFO] Datos parseados:");
              Serial.println("  Nombre: " + nombre);
              Serial.println("  Tipo: " + tipo);
              Serial.println("  Hora: " + hora);
              
              // Mostrar mensaje personalizado
              String tipoMsg = (tipo == "entrada") ? "ENTRADA" : "SALIDA";
              Serial.println("[DISPLAY] Actualizando pantalla: " + tipoMsg + " | " + nombre + " | " + hora);
              drawStatus(tipoMsg.c_str(), nombre.c_str(), hora.c_str());
            } else {
              Serial.println("[WARN] JSON sin estructura esperada");
              drawStatus("Exito!", uidHex.c_str(), "Registrado");
            }
          } else {
            // Error al parsear JSON
            Serial.println("[ERROR] Error al parsear JSON: " + String(error.c_str()));
            drawStatus("Error JSON", "Parse error", uidHex.c_str());
          }
        } else if (httpCode == 404) {
          // Tag no registrado
          StaticJsonDocument<256> doc;
          DeserializationError error = deserializeJson(doc, response);
          
          if (!error && doc.containsKey("error")) {
            String mensaje = doc["error"]["mensaje"] | "Tag no registrado";
            drawStatus("ERROR", "Tag sin", "registrar");
          } else {
            drawStatus("ERROR", "Tag no", "registrado");
          }
        } else {
          // Intentar obtener mensaje de error del servidor
          StaticJsonDocument<256> doc;
          DeserializationError error = deserializeJson(doc, response);
          
          if (!error && doc.containsKey("error")) {
            String mensaje = doc["error"]["mensaje"] | "Error HTTP";
            drawStatus("Error", mensaje.c_str(), String(httpCode).c_str());
          } else {
            drawStatus("Error HTTP", String(httpCode).c_str(), uidHex.c_str());
          }
        }
      } else {
        drawStatus("Error envio", "No conectado", uidHex.c_str());
      }
      
      http.end();
    } else {
      drawStatus("Sin WiFi", uidHex.c_str(), "No enviado");
    }
    
    delay(5000); // Tiempo largo para leer la respuesta en pantalla
    drawStatus("Sistema Listo", "Esperando", "tarjeta NFC");
    delay(1500); // Dar tiempo a que actualice antes de siguiente lectura
  }
  
  delay(100);
}
