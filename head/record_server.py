#!/usr/bin/python
import serial
import pyaudio
import sys
import threading
import time
import wave



"""
Helper class to allow for signaling all threads.
"""
class GlobalState:
  def __init__(self):
    # Whether the talking head has been activated or not.
    self.tickCount = False


"""
Class for handling communication to the talking head arduino.

Communication is done via serial port and this class will activate and reset
the talking head lights as needed.
"""
class HeadThread (threading.Thread):
  def __init__(self, threadId, name, state, comPort, baud):
    threading.Thread.__init__(self)
    # Thread info
    self.threadId = threadId
    self.name = name
    self.state = state
    # Serial port params
    self.comPort = comPort
    self.baud = baud
    self.ser = None
    # Signal flags
    self.exitFlag = False

  """Thread entry point."""
  def run(self):
    # Initialize communication on the serial port.
    print 'Starting head thread'
    while self.exitFlag is not True and self.ser is None:
      self.ser = serial.Serial(self.comPort, self.baud, timeout=1)

    if self.ser is not None:
      self.ser.close()
      self.ser.open()

    # Listen for the signal from the arduino that the activation
    # cylinder has been inserted ('POWER') or that the reset button has been
    # pressed ('OK').
    while self.exitFlag is not True and self.ser is not None:
      data = self.ser.readline()
      if data == 'OK\r\n':
        print 'power off'
        self.state.tickCount = False
      if data == 'POWER\r\n':
        print 'power on'
        self.state.tickCount = True

    if self.ser is not None:
      self.ser.close()                                  
    print 'Exiting head thread'


"""
Class for playing audio clues for the talking head.

The audio clues are simple wave files that have been pre-recorded and
pitch-shifted. We use the pyaudio library to play these sounds.
"""
class AudioThread (threading.Thread):
  def __init__(self, threadId, name, audio, state):
    threading.Thread.__init__(self)
    # Thread Info
    self.threadId = threadId
    self.name = name
    self.state = state
    # pyAudio Params
    self.audio = audio
    self.stream = None
    # Signal flags
    self.lastTickCount = False
    self.exitFlag = False
    # Wave files to play
    self.all_wf = [
      wave.open('01-greeting.wav', 'rb'),
      wave.open('02-clue1.wav', 'rb'),
      wave.open('03-trans12.wav', 'rb'),
      wave.open('04-clue2.wav', 'rb'),
      wave.open('05-trans23.wav', 'rb'),
      wave.open('06-clue3.wav', 'rb'),
      wave.open('07-final.wav', 'rb')
    ]

  """Thread entry point."""
  def run(self):
    print 'Starting audio thread'
    while self.exitFlag is not True:
      if self.lastTickCount != self.state.tickCount:
        self.lastTickCount = self.state.tickCount
        print self.lastTickCount
        if self.lastTickCount is True:
          # Play the entire set three times.
          self.playAll()
          self.rewind()
          time.sleep(2)
          self.playAll()
          self.rewind()
          time.sleep(2)
          self.playAll()
          self.rewind()
      time.sleep(0.5)
    print 'Exiting audio thread'

  def playAll(self):
    for wf in self.all_wf:
      self.playSound(wf)

  def rewind(self):
    for wf in self.all_wf:
      wf.rewind()

  def playSound(self, wf):
    CHUNK = 1024
    # Open audio device stream.
    self.stream = self.audio.open(
      format=self.audio.get_format_from_width(wf.getsampwidth()),
      channels=wf.getnchannels(),
      rate=wf.getframerate(), output=True)
    # Read all chunks of WAV data and put in device stream.
    data = wf.readframes(CHUNK)
    while len(data) > 0:
      self.stream.write(data)
      data = wf.readframes(CHUNK)
    self.stream.stop_stream()
    self.stream.close()


"""
Main server entry point.
"""
def main():
  state = GlobalState()
  threads = []
  audio = pyaudio.PyAudio()

  thread1 = AudioThread(1, 'Speaker', audio, state)
  thread2 = HeadThread(2, 'Head', state, 'COM4', 19200)
  threads.append(thread1)
  threads.append(thread2)
  thread1.start()
  thread2.start()

  # Spin the main thread.
  try:
    while True:
      time.sleep(1)
  except KeyboardInterrupt:
    pass

  # Wait "sufficiently" for all threads to finish.
  thread1.exitFlag = True
  thread2.exitFlag = True
  for t in threads:
    t.join(5)
  
  # Cleanup.
  audio.terminate()
  print 'Exiting Main Thread'
  sys.exit()


if __name__ == "__main__": main()
