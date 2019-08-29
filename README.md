# Description

The idea of this repo is to create a web app where you can scan a Sudoku puzzle
from a newspaper or similar, then solve the puzzle and display the solution.

I used [a separate project](https://github.com/taylorjg/sudoku-scanner) to
develop code to scan a Sudoku puzzle. It uses OpenCV.js to find
the bounding box of the puzzle and a couple of trained TensorFlow.js models to 
distinguish between blanks/digits and to recognise digits 1-9.

I use [dlxlib](https://www.npmjs.com/package/dlxlib) to solve the Sudoku puzzle.
This is my implementation of [Knuth's Algorithm X](https://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X).

# Huge Download

It should be noted that this web app takes ages to load because
some of the resources are very large:

| Resource | Size |
| -------- | ---- |
| ~~opencv_4.1.1.js~~ | ~~8.7M~~ |
| opencv.js | 4.1MB |
| bundle.js | 976KB |
| models/digits/model.weights.bin | 626KB |
| models/blanks/model.weights.bin | 304KB |

I clearly still have some work to do to reduce the size of these resources.

> **UPDATE:** I have managed to halve the size of opencv.js by making my own custom build.

# Instructions

* Browse to https://sudoku-buster.herokuapp.com/
* Wait for the web app to load
* Tap the big square to start the webcam
* Tap the big square again to capture an image of a Sudoku puzzle
* If the Sudoku puzzle has been scanned correctly, then the solution should be displayed
  * Given digits are shown in magenta and calculated digits are shown in black
* Tap the solution to start the webcam again to scan another Sudoku puzzle

# Links

* [sudoku-scanner](https://github.com/taylorjg/sudoku-scanner)
* [Knuth's Algorithm X](https://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X)
* [Dancing Links](https://en.wikipedia.org/wiki/Dancing_Links)
* [dlxlib](https://www.npmjs.com/package/dlxlib)
