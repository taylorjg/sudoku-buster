# Description

The idea of this repo is to create a web app where you can scan a Sudoku puzzle
from a newspaper or similar, then automatically solve the puzzle and display the solution.

I used [a separate project](https://github.com/taylorjg/sudoku-scanner) to
develop code to scan a Sudoku puzzle. It uses OpenCV.js to find
the bounding box of the puzzle and a couple of trained TensorFlow.js models to 
distinguish between blanks/digits and to recognise digits 1-9.

I use [dlxlib](https://www.npmjs.com/package/dlxlib) to solve the Sudoku puzzle
(my implementation of [Knuth's Algorithm X](https://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X)).

# Large Download

It should be noted that this web app takes quite a while to load because
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
* Point the webcam at a Sudoku puzzle
* When the web app recognises the puzzle, it stops the webcam and shows the solution
* Given digits are shown in magenta and calculated digits are shown in black
* For best results:
  * Try to position the puzzle roughly within the guides
  * Ensure the puzzle is in focus
  * Ensure the puzzle is straight (not wonky or warped)
  * Try to avoid shadows on the image
* You can tap the webcam to cancel the scanning and stop the webcam
* Tap the solution to start the webcam again to scan another Sudoku puzzle

# Links

* [sudoku-scanner](https://github.com/taylorjg/sudoku-scanner)
* [Knuth's Algorithm X](https://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X)
* [Dancing Links](https://en.wikipedia.org/wiki/Dancing_Links)
* [dlxlib](https://www.npmjs.com/package/dlxlib)
