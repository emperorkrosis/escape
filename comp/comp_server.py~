#!/usr/bin/python

import json
import os
#import pyserial
import re
import struct
import sys
import threading
import time
import urlparse
import SimpleHTTPServer, SocketServer



"""Logging helper that collects up log data and fixes it if necessary."""
class ThreadSafeLogger:
  def __init__(self, maxSize):
    self.lock = threading.Lock()
    self.logLines = []
    self.maxSize = maxSize

  def append(self, line):
    self.lock.acquire()
    self.logLines.append(line)
    size = len(self.logLines)
    if (size > 2 * self.maxSize):
      self.logLines = self.logLines[-self.maxSize:]
    self.lock.release()
    print line

  def getLatest(self, num):
    self.lock.acquire()
    result = self.logLines[-num:]
    self.lock.release()
    return result

  def getAll(self):
    self.lock.acquire()
    result = self.logLines[:]
    self.lock.release()
    return result



"""The global state for the server."""
class ReplicantState:
  def __init__(self):
    self.img = ""
    self.name = ""
    self.dob = ""
    self.doe = ""
    self.retinaValid = False
    self.hatActive = False

  # Update the state from the query in the signal.
  def fromQuery(self, query):
    if "img" in query and len(query["img"]) > 0:
      self.img = query["img"][0]
    if "name" in query and len(query["name"]) > 0:
      self.name = query["name"][0]
    if "dob" in query and len(query["dob"]) > 0:
      self.dob = query["dob"][0]
    if "doe" in query and len(query["doe"]) > 0:
      self.doe = query["doe"][0]
    if "ret" in query and len(query["ret"]) > 0:
      self.retinaValid = query["ret"][0] in ["True", "true", "1"]
    if "hat" in query and len(query["hat"]) > 0:
      self.hatActive = query["hat"][0] in ["True", "true", "1"]
    pass

  # Convert the state to a JSON string.
  def toJson(self):
    return json.dumps({"img": self.img, "name": self.name, "dob": self.dob, "doe": self.doe, "ret": self.retinaValid, "hat": self.hatActive})


######################## SCANNER ##########################


"""Class for checking for signal from the retina scanner."""
class RetinaThread (threading.Thread):
  def __init__(self, threadId, name, logger, comPort, baud, state):
    threading.Thread.__init__(self)
    self.threadId = threadId
    self.name = name
    self.logger = logger
    self.comPort = comPort
    self.baud = baud
    self.state = state
    self.exitFlag = False

  """Main thread entry point."""
  def run(self):
    self.logger.append("Starting " + self.name)

    # Try opening the serial port.
    ser = None
    while self.exitFlag is not True and ser is None:
      #ser = serial.Serial(self.comPort, self.baud, timeout=1)
      ser = 1
      time.sleep(0.5)

    # Read the retina state.
    while self.exitFlag is not True:
      # TODO(cmprince): Read the state of the retina scanner.
      # self.state.retinaValid = True
      time.sleep(0.5)
    self.logger.append("Exiting " + self.name)


######################## HEAD GEAR ##########################


"""Class for signaling the hat to activate."""
class HatThread (threading.Thread):
  def __init__(self, threadId, name, logger, comPort, baud, state):
    threading.Thread.__init__(self)
    self.threadId = threadId
    self.name = name
    self.logger = logger
    self.comPort = comPort
    self.baud = baud
    self.state = state
    self.exitFlag = False

  """Main thread entry point."""
  def run(self):
    self.logger.append("Starting " + self.name)

    # Try opening the serial port.
    ser = None
    while self.exitFlag is not True and ser is None:
      #ser = serial.Serial(self.comPort, self.baud, timeout=1)
      ser = 1
      time.sleep(0.5)

    # Maybe tell the hat to start.
    while self.exitFlag is not True:
      if self.state.hatActive is True:
        # TODO(cmprince): Activate the hat.
        pass
      time.sleep(0.5)
    self.logger.append("Exiting " + self.name)


######################## HTML ##########################


"""Class for sending and receiving HTTP messages."""
class HtmlThread (threading.Thread):
  def __init__(self, threadId, name, logger, state, port=8000):
    threading.Thread.__init__(self)
    self.threadId = threadId
    self.name = name
    self.logger = logger
    self.state = state
    self.port = port
    self.handler = CompRequestHandler
    self.httpd = CompTCPServer(("", self.port), self.handler, self.state)

  def run(self):
    self.logger.append("Starting " + self.name)
    self.httpd.serve_forever()
    self.logger.append("Exiting " + self.name)



"""Override the base TCPServer to request handler can access the state."""
class CompTCPServer (SocketServer.TCPServer):
  def __init__(self, addr, handler, state):
    SocketServer.TCPServer.__init__(self, addr, handler)
    self.state = state



"""Custom request handler."""
class CompRequestHandler (SimpleHTTPServer.SimpleHTTPRequestHandler):
  def __init__(self, req, addr, server):
    self.replicantPath_ = 'images/replicants/'
    SimpleHTTPServer.SimpleHTTPRequestHandler.__init__(self, req, addr, server)

  # Entry point for all GET requets.
  def do_GET(self):
    parsedParams = urlparse.urlparse(self.path)
    queryParsed = urlparse.parse_qs(parsedParams.query)
    if parsedParams.path == '/signal':
      return self.processSignalRequest(queryParsed)
    if parsedParams.path == '/rep':
      return self.processRepRequest(queryParsed)
    return SimpleHTTPServer.SimpleHTTPRequestHandler.do_GET(self)

  # Handle the /signal requests.
  def processSignalRequest(self, query):
    self.server.state.fromQuery(query)
    response = self.server.state.toJson()
    self.send_response(200)
    self.send_header('Content-Type', 'application/json')
    self.end_headers()
    self.wfile.write(response)
    self.wfile.close()

  # Handle the /rep requests
  def processRepRequest(self, query):
    mypath = self.replicantPath_
    self.server.state.fromQuery(query)
    fs = [f for f in os.listdir(mypath) if os.path.isfile(os.path.join(mypath, f))]
    fs = [os.path.join(mypath, f) for f in fs]
    response = json.dumps(fs)
    self.send_response(200)
    self.send_header('Content-Type', 'application/json')
    self.end_headers()
    self.wfile.write(response)
    self.wfile.close()

  # Entry point for all POST requests.
  def do_POST(self):
    if self.path == '/store':
      r, info = self.processPostRequest()
      if r is False:
        response = '<html><head><title>Failed</title></head><body>' + info + '</body></html>'
      else:
        response = '<html><head><title>Success</title></head><body>Success</body></html>'
      self.send_response(200)
      self.send_header('Content-Type', 'text/html')
      self.send_header('Content-Length', str(len(response)))
      self.end_headers()
      self.wfile.write(response)
      self.wfile.close()      
    else:
      return SimpleHTTPServer.SimpleHTTPRequestHandler.do_POST(self)

  def processPostRequest(self):
    # Get the boundary string.
    boundary = self.headers.plisttext.split('=')[1]
    remainbytes = int(self.headers['content-length'])
    # Ensure the first line is the boundary.
    line = self.rfile.readline()
    remainbytes -= len(line)
    if not boundary in line:
      return (False, "Content NET begin with boundary")
    # Ensure the second line is the content disposition and get filename.
    line = self.rfile.readline()
    remainbytes -= len(line)
    fn = re.findall(r'Content-Disposition.*name="file"; filename="(.*)"', line)
    if not fn:
      return (False, 'Cannot find out file name...')
    path = self.replicantPath_
    fn = os.path.join(path, fn[0])
    # Read the content type and blank lines.
    line = self.rfile.readline()
    remainbytes -= len(line)
    line = self.rfile.readline()
    remainbytes -= len(line)
    # Open the output file.
    try:
      out = open(fn, 'wb')
    except IOError:
      return (False, 'Cannot create file to write...')

    # Read all the lines and write.
    preline = self.rfile.readline()
    remainbytes -= len(preline)
    while remainbytes > 0:
      line = self.rfile.readline()
      remainbytes -= len(line)
      if boundary in line:
        preline = preline[0:-1]
        if preline.endswith('\r'):
          preline = preline[0:-1]
        out.write(preline)
        out.close()
        return (True, "File '%s' upload success!" % fn)
      else:
        out.write(preline)
        preline = line
    return (False, "Unexpect Ends of data.")

    
######################## MAIN ENTRY  ##########################


# Main entry point for server.
def main():
  threads = []
  logger = ThreadSafeLogger(1000)
  state = ReplicantState()

  # Retina Scanner Thread
  thread1 = RetinaThread(1, "Retina", logger, 'COM3', 19200, state)
  # Head Ware Thread
  thread2 = HatThread(2, "Hat", logger, 'COM4', 19200, state)
  # HTTP Thread
  thread3 = HtmlThread(3, "HTTP", logger, state)

  threads.append(thread1)
  threads.append(thread2)
  threads.append(thread3)

  thread1.start()
  thread2.start()
  thread3.start()

  # Spin the main thread?
  try:
    while True:
      time.sleep(1)
  except KeyboardInterrupt:
    pass

  # Signal all threads to terminate cleanly.
  thread1.exitFlag = True
  thread2.exitFlag = True
  thread3.httpd.shutdown()

  # Wait "sufficiently" for all threads to finish.
  for t in threads:
    t.join(5)
      
  # Print out the latest values.
  print logger.getLatest(100)
  print "Exiting Main Thread"

  # Kill the process.
  sys.exit()


if __name__ == "__main__": main()
