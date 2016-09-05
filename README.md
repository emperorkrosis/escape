# Halloween Puzzle Escape Rooms
## Overview
Every year my friends and I put on a puzzle escape room for halloween. This repository contains a collection of code used to help put on these puzzle rooms.

## Escape Room 2015: Bladerunner Theme
In 2015 our escape room was Bladerunner themed. The basic premise was that one of the 

This repository contains code for two different components of the puzzle escape room:
1. The first is the terminal interface that the escapees needed to log into in order to find out who the replicant was and to reprogram them so that they won't "terminate".
2. The second is the talking automaton head that was powered by arduino and a mini PC.

### Computer Terminal Inteface

The code implementing the computer interface is a fairly simple state
machine as seen below:

```
 START   +----------------+
   |     |                |
   V     V                |
+----------+   +--------+ |
| EYE SCAN |<--| ACCESS | |
+----------+   | DENIED | |
     |      \  +--------+ |
     |       \      ^     |
     V        V     |     |
+----------+  +---------+ |
| EYE GOOD |  | EYE BAD | |
+----------+  +---------+ |
     |                    |
     V                    |
+----------+   +--------+ |
| PASSWORD |<--| ACCESS | |
|          |-->| DENIED | |
+----------+   +--------+ |
     |                    |
     V                    |
+-----------+             /
|  ACCESS   |            /
| ANIMATION |           /
+-----------+          /
     |                /
     V               /
+-----------+       /
| REPLICANT |      / RESET
|  DOSSIER  |     /
+-----------+    /
     |          /
     V         /
+---------+   /
| SUCCESS |--+
+---------+
```

The computer interface was designed to interoperate with two other pieces of hardware. First there was a retina scanner. The retina scanner was powered by an arduino with a magnet sensor that could detect when a specially created fake eyeball was placed on the sensor. This eyeball would then trigger the terminal to advance to the password screen.

The following diagram shows the basic setup of how the command and control server would work to wizard-of-oz the interface.

```
+----------------------------+
| Retina Reader (Arduino #1) |
+----------------------------+
  #
  |
  |
  #
+---------------+  XHR /status       +--------+
|    Server     |<-------------------| Chrome |
|    (VAIO)     |  XHR /get_replicant| (VAIO) |
|               |------------------->|        |
|               |  XHR /get_retina   |        |
|               |------------------->|        |
|               |  HTML /index.html  |        |
|               |------------------->|        |
|               |                    +--------+
|               |
|               |  XHR /get_status   +--------------+
|               |------------------->|    Chrome    |
|               |  XHR /replicant    | (C&C Laptop) |
|               |<-------------------|              |
|               |  HTML /cc.html     |              |
|               |------------------->|              |
+---------------+                    +--------------+
  #
  |
  |
  #
+----------------------------+
|  Hat (Arduino #2)          |
+----------------------------+
```

### Talking Head
We built a creepy doll that we wanted to communicate with the puzzlers in some way. The original intention with the talking head puzzle was to build a sort of walkie-talkie with pitch shifting to give the talking head a creepy voice and then play a game of 20-questions with the puzzlers. In the end we ran out of time to fully implement this so we ended up with a three part puzzle that the talking head spoke out loud.

In order to get the audio clues the puzzlers first needed to activate the talking head. This was accomplished by inserting a special "vial" into a slot on the talking head. This vial contained a magnet that activated a reed switch. The switch was attached to an arduino that would then essentially "power-up" the robot (screenshot of the circuit to be added later).

Once the head was powered up it would start to play the audio clues. There were three clues: "the 21st letter of the alphabet", "when you siege a castle you use a battering...what?", and "if you are running from the law you are on the what?". The answers are then "U", "ram", and "lam", which are homophones for "ewe", "ram", and "lamb"...all types of "sheep". Sheep was the answer to this part of the puzzle room.

The head/ subdirectory of this project contains the code for the talking head puzzle. The pitchshifter/ directory contains a webpage using HTML5Audio in order to record audio clips, apply a pitch shift, and then generate a WAV file. The sounds/ subdirectory contains all the audio clips used for the talking head. The file record_server.py was running on a Windows Intel Atom mini-PC. It's job is to listen for when the arduino signals (via serial port) that it has been activated and then to play all the clue clips via some hidden speakers. The talking_head.ino file is the arduino code that runs the talking head.

