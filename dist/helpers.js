'use strict';

var mv = require('mv');
var fs = require('fs');
var path = require('path');
var dateformat = require('dateformat');
var formats = require('./formats');

/**
 * Check if file is valid
 *
 * @param {string} name Name of file
 * @param {string} dir  File directory
 */
var isValidFile = function isValidFile(name, dir) {
  return name.indexOf('.') !== 0 && !fs.statSync(path.join(dir, name)).isDirectory();
};

/**
 * Create a directory if it does not exist
 *
 * @param {string} folderPath Path of folder to be created
 */
var mkdir = function mkdir(folderPath) {
  try {
    fs.mkdirSync(folderPath);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw new Error('Error occurred while creating a new directory');
    }
  }
};

/**
 * Get extension of a file
 *
 * @param {string} fileName File name
 */
var getFileExtension = function getFileExtension(fileName) {
  var i = fileName.lastIndexOf('.');
  return i < 0 ? '' : fileName.substr(i + 1);
};

/**
 * Returns a promise for movement of file to specific directory;
 * Also creates the output directory if not existing
 *
 * @param {Object}  spinner  Ora spinner instance
 * @param {string}  source   Source directory name
 * @param {string}  output   Output directory name
 * @param {string}  fileName File name
 * @param {string}  type     File type
 * @param {boolean} listOnly Only list the commands which will be executed for movement
 */
var organize = function organize(spinner, source, output, fileName, type, listOnly) {
  var typeDir = path.resolve(output, type);

  // Create the directory only if listOnly is not set
  if (!listOnly) {
    mkdir(output);
    mkdir(typeDir);
  }

  // Return promise for moving a specific file to specific directory
  return new Promise(function (resolve, reject) {
    // If listOnly is set, output the command that will be executed without
    // moving the file
    if (listOnly) {
      var listMessage = 'mv ' + path.resolve(source, fileName) + ' ' + path.resolve(typeDir, fileName);
      spinner.info(listMessage);
      resolve(listMessage);
    } else {
      // Move the file
      mv(path.resolve(source, fileName), path.resolve(typeDir, fileName), function (err) {
        if (err) {
          var errorMessage = 'Couldn\'t move ' + fileName + ' because of following error: ' + err;
          spinner.warn(errorMessage);
          reject(new Error(errorMessage));
        } else {
          var successMessage = 'Moved ' + fileName + ' to ' + type + ' folder';
          spinner.info(successMessage);
          resolve(successMessage);
        }
      });
    }
  });
};

/**
 * Organizes files using pre-configured formats and file extensions
 *
 * @param {Array}   files     File names
 * @param {string}  sourceDir Source directory name
 * @param {string}  outputDir Output directory name
 * @param {Object}  spinner   Ora spinner instance
 * @param {boolean} listOnly  Only list the commands which will be executed for movement
 */
var organizeByDefaults = function organizeByDefaults(files, sourceDir, outputDir, spinner, listOnly) {
  var moved = [];

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var file = _step.value;

      // Check if file is valid
      if (isValidFile(file, sourceDir)) {
        // Get file extension
        var extension = getFileExtension(file).toUpperCase();
        var isMoved = false;

        // Iterating over format types
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = Object.keys(formats)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var type = _step2.value;

            if (formats[type].indexOf(extension) >= 0) {
              // Output to spinner that this file will be moved
              spinner.info('Moving file ' + file + ' to ' + type);

              // Move the file to format directory
              var pOrganize = organize(spinner, sourceDir, outputDir, file, type, listOnly);

              // Push the promise to array
              moved.push(pOrganize);
              isMoved = true;
              break;
            }
          }

          // If file extension does not exist in config,
          // move the file to Miscellaneous folder
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }

        if (!isMoved) {
          // Output to spinner that this file will be moved
          spinner.info('Moving file ' + file + ' to Miscellaneous');

          // Push the promise to array
          moved.push(organize(spinner, sourceDir, outputDir, file, 'Miscellaneous', listOnly));
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return moved;
};

/**
 * Organize specific file types
 *
 * @param {Array}   spFormats Organize only specific formats
 * @param {string}  spFolder  Move specific files to this folder name
 * @param {Array}   files     File names
 * @param {string}  sourceDir Source directory name
 * @param {string}  outputDir Output directory name
 * @param {Object}  spinner   Ora spinner instance
 * @param {boolean} listOnly  Only list the commands which will be executed for movement
 */
var organizeBySpecificFileTypes = function organizeBySpecificFileTypes(spFormats, spFolder, files, sourceDir, outputDir, spinner, listOnly) {
  // Filter file names on specific formats
  var names = files.filter(function (name) {
    if (!isValidFile(name, sourceDir)) {
      return false;
    }

    var extension = getFileExtension(name);
    return spFormats.indexOf(extension) !== -1;
  });

  var moved = [];

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = names[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var name = _step3.value;

      // Output to spinner that this file will be moved
      spinner.info('Moving file ' + name + ' to ' + spFolder);

      // Move the file to output directory
      var pOrganize = organize(spinner, sourceDir, outputDir, name, spFolder, listOnly);

      // Push the promise to array
      moved.push(pOrganize);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return moved;
};

/**
 * Organizes the files by creation date
 *
 * @param {Array}   files     Files to be organized
 * @param {string}  sourceDir Source directory name
 * @param {string}  outputDir Output directory name
 * @param {object}  spinner   Ora spinner instance
 * @param {boolean} listOnly  Only list the commands which will be executed for movement
 */
var organizeByDates = function organizeByDates(files, sourceDir, outputDir, spinner, listOnly) {
  var moved = [];

  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = files[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var file = _step4.value;

      // Get date when the file was created
      var date = fs.statSync(path.join(sourceDir, file));
      date = dateformat(new Date(date.mtime), 'yyyy-mm-dd');

      // Output to spinner that this file will be moved
      spinner.info('Moving file ' + file + ' to ' + date + ' folder');

      // Move the file to output directory
      var pOrganize = organize(spinner, sourceDir, outputDir, file, date, listOnly);

      // Push the promise to array
      moved.push(pOrganize);
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return moved;
};

module.exports = {
  mkdir: mkdir,
  getFileExtension: getFileExtension,
  organize: organize,
  organizeByDefaults: organizeByDefaults,
  organizeBySpecificFileTypes: organizeBySpecificFileTypes,
  organizeByDates: organizeByDates
};