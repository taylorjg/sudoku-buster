# Description

The idea of this repo is to create a web application to scan a Sudoku puzzle
from a newspaper or similar, solve the puzzle and display the solution.

I used [a separate project](https://github.com/taylorjg/sudoku-scanner) to
develop code to scan a Sudoku puzzle. It uses:

* **OpenCV.js** to find the bounding box of the puzzle
* **TensorFlow.js** to train a model to recognise blank squares / digits 1 through 9

I use [dlxlib](https://www.npmjs.com/package/dlxlib) to solve the Sudoku puzzle
(my implementation of [Knuth's Algorithm X](https://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X)).

# Large Download

It should be noted that this web app takes quite a while to load because
some of the resources are very large:

| Resource | Size |
| -------- | ---- |
| ~~opencv_4.1.1.js~~ | ~~8.7M~~ |
| opencv.js | 4.1MB |
| index.bundle.js | 997KB |
| ~~models/digits/model.weights.bin~~ | ~~626KB~~ |
| ~~models/blanks/model.weights.bin~~ | ~~304KB~~ |
| models/cells/model.weights.bin | 627KB |

I clearly still have some work to do to reduce the size of these resources.

> **UPDATE:** I have managed to halve the size of opencv.js by making my own custom build.

# Instructions

* Browse to https://sudoku-buster.herokuapp.com/
* Wait for the web app to load
* Tap the big square to start the webcam
* Point the webcam at a Sudoku puzzle
* When the web app recognises the puzzle, it stops the webcam and shows the solution
* Given digits are shown in magenta and calculated digits are shown in black
* For best results:
  * Try to position the puzzle roughly within the guides
  * Ensure the puzzle is in focus
  * Ensure the puzzle is straight (not wonky or warped)
  * Try to avoid shadows
* You can tap the webcam to cancel scanning and return to the start
* Tap the solution to return to the start

# Query Params

The following query params can be added:

| Query Param | Description |
| ----------- | ----------- |
| c           | Draw the largest contour (red) |
| cs          | Draw the four corners of the largest contour (magenta) |
| bb          | Draw the bounding box of the largest contour (blue) |
| gs          | Draw all the grid squares (green) |
| fps         | Display the number of webcam captures being processed per second |

The following link enables all options (the Everything Bagel):

* https://sudoku-buster.herokuapp.com/index.html?c&cs&bb&gs&fps

# TODO

* Try to further reduce the size of opencv.js
* Use a service worker to cache large files
* Improve scanning speed/accuracy/robustness
  * ~~Autocorrect warped images~~
  * Tune the training of the cells model
  * Re-train the cells model on binary images
    * In an attempt to better handle different lighting conditions
* Upload performance metrics and store them in a document database
* Add a new web page for analysis of uploaded performance metrics

# Tests

A few basic in-browser tests can be found here:

* [Tests](https://sudoku-buster.herokuapp.com/test.html)

# Links

* For the OpenCV approach to finding the bounding box, I borrowed heavily from:
  * [Emaraic - Real-time Sudoku Solver](http://emaraic.com/blog/realtime-sudoku-solver)
  * [tahaemara/real-time-sudoku-solver: Real-time Sudoku Solver using Opencv and Deeplearning4j](https://github.com/tahaemara/real-time-sudoku-solver)
* [sudoku-scanner](https://github.com/taylorjg/sudoku-scanner)
* [Knuth's Algorithm X](https://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X)
* [Dancing Links](https://en.wikipedia.org/wiki/Dancing_Links)
* [dlxlib](https://www.npmjs.com/package/dlxlib)
* [MongoDB Node.JS Driver](https://mongodb.github.io/node-mongodb-native/)
  * [MongoDB Node.js Driver Documentation](https://mongodb.github.io/node-mongodb-native/3.3/)
  * [Node.js MongoDB Driver API](https://mongodb.github.io/node-mongodb-native/3.3/api/index.html)
