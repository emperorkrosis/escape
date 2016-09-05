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
This will be uploaded at a later date.
