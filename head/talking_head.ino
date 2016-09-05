#include <Servo.h>

// Pin Assignments
const int SWITCH_PIN = 13;
const int RED_POWER_LED_PIN = 12;
const int GREEN_POWER_LED_PIN = 11;
const int EYE_LED_PIN = 9;
const int PROCESS_LED_1_PIN = 3;
const int PROCESS_LED_2_PIN = 4;
const int PROCESS_LED_3_PIN = 5;
const int PROCESS_LED_4_PIN = 6;
const int PROCESS_LED_5_PIN = 7;
const int SERVO_PIN = 14; // analog pin 0
const int SERVO_MIN = 0;
const int SERVO_MAX = 40;
const int SERVO_OFFSET = 21;

// Main Setup Function.
void setup() {
  // Initialize common components.
  Serial.begin(19200);
  randomSeed(1234);

  // Initialize all other components.
  powerSetup();
  eyeBlinkSetup();
  processSetup();
  servoSetup();
  Serial.println("OK");
}

// Main Loop Function.
void loop() {
  if (powerLoop()) {
    long currentTimeMS = millis();
    eyeBlinkLoop(currentTimeMS);
    processLoop(currentTimeMS);
    servoLoop();
  }
}

// ############## DROID POWER ##############
boolean started = false;

void powerSetup() {
  pinMode(RED_POWER_LED_PIN, OUTPUT);
  pinMode(GREEN_POWER_LED_PIN, OUTPUT);
  pinMode(SWITCH_PIN, INPUT);

  digitalWrite(RED_POWER_LED_PIN, HIGH);
  digitalWrite(GREEN_POWER_LED_PIN, LOW);
}

boolean powerLoop() {
    if (!started && digitalRead(SWITCH_PIN) == HIGH) {
      started = true;
      digitalWrite(RED_POWER_LED_PIN, LOW);
      digitalWrite(GREEN_POWER_LED_PIN, HIGH);
      while(Serial.available()){
        Serial.read();
      }
      Serial.println("POWER");
    }
    return started;
}

// ############## EYE BLINK ###############
// Minimum time (in milliseconds) to keep the eyes open between blinks.
const long MIN_TIME_BETWEEN_BLINKS_MS = 500;
// Maximum time (in milliseconds) to keep the eyes open between blinks.
const long MAX_TIME_BETWEEN_BLINKS_MS = 3000;
// Time (in milliseconds) to keep the eye close when blinking.
const long BLINK_DURATION_MS = 300;

long lastBlinkTimeMS = 0;
long eyeOpenDurationMS = 0;

void eyeBlinkSetup() {
  pinMode(EYE_LED_PIN, OUTPUT);

  digitalWrite(EYE_LED_PIN, LOW);
}

void eyeBlinkLoop(const long currentTimeMS) {
  // Check if the eye should be closed yet.
  if (currentTimeMS - lastBlinkTimeMS > eyeOpenDurationMS) {
    digitalWrite(EYE_LED_PIN, LOW);
  } else {
    digitalWrite(EYE_LED_PIN, HIGH);
  }

  // Reset the nextBlinkTime if we passed the blink duration.
  if (currentTimeMS - lastBlinkTimeMS > eyeOpenDurationMS + BLINK_DURATION_MS) {
    lastBlinkTimeMS = currentTimeMS;
    eyeOpenDurationMS = random(MIN_TIME_BETWEEN_BLINKS_MS, MAX_TIME_BETWEEN_BLINKS_MS);
  }
}

// ############## COMPUTATION LEDS ##############
// Interval (in milliseconds) between switching the pattern on the processing LEDs.
const long PROCESS_DURATION_MS = 900;

long lastProcessTimeMS = 0;

void processSetup() {
  pinMode(PROCESS_LED_1_PIN, OUTPUT);
  pinMode(PROCESS_LED_2_PIN, OUTPUT);
  pinMode(PROCESS_LED_3_PIN, OUTPUT);
  pinMode(PROCESS_LED_4_PIN, OUTPUT);
  pinMode(PROCESS_LED_5_PIN, OUTPUT);

  digitalWrite(PROCESS_LED_1_PIN, LOW);
  digitalWrite(PROCESS_LED_2_PIN, LOW);
  digitalWrite(PROCESS_LED_3_PIN, LOW);
  digitalWrite(PROCESS_LED_4_PIN, LOW);
  digitalWrite(PROCESS_LED_5_PIN, LOW);
}

void processLoop(const long currentTimeMS) {
  if (currentTimeMS > lastProcessTimeMS + PROCESS_DURATION_MS) {
    lastProcessTimeMS = currentTimeMS;
    // Assign a random on/off value to each LED.
    long bits = random(1024);
    processLightHelper(PROCESS_LED_1_PIN, bits, 0);
    processLightHelper(PROCESS_LED_2_PIN, bits, 1);
    processLightHelper(PROCESS_LED_3_PIN, bits, 2);
    processLightHelper(PROCESS_LED_4_PIN, bits, 3);
    processLightHelper(PROCESS_LED_5_PIN, bits, 4);
  }
}

// Helper that takes a pin and an index into a random set of bits and
// sets that pin equal to the state of the random bit.
void processLightHelper(const int pin, const long bits, const int index) {
  long state = bits & (1 << index);
  if (state > 0) {
    digitalWrite(pin, HIGH);
  } else {
    digitalWrite(pin, LOW);
  }
}

// ############## SERVO CONTROL ##############
Servo servo1;

void servoSetup() {
  pinMode(SERVO_PIN, OUTPUT);

  servo1.attach(SERVO_PIN);
  servo1.write(SERVO_OFFSET);
}

void servoLoop() {
  static int v = 0;
  if (Serial.available()) {
    char ch = Serial.read();
    switch(ch) {
      case '0'...'9':
        v = (v * 10) + (ch - '0');
        break;
      case 's':
        if (v < SERVO_MIN) {
          v = SERVO_MIN;
        }
        if (v > SERVO_MAX) {
          v = SERVO_MAX;
        }
        v = v + SERVO_OFFSET;
        servo1.write(v);
        v = 0;
        break;
    }
  }
}
