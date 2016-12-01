'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Project Schema
 */
var ProjectSchema = new Schema({
  code        : {type: String, default: ''},
  name: {
    type: String,
    default: '',
    required: 'Please fill the project name',
    trim: true
  },
  description: {
    type: String,
    default: '',
    required: 'Please complete the project description',
    trim: true
  },
  github: {
    type: String,
    default: '',
    trim: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  program: {
    type: Schema.ObjectId,
    ref: 'Program'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  }
});

ProgramSchema.statics.findUniqueCode = function (title, suffix, callback) {
  var _this = this;
  var possible = 'prj-' + (title.toLowerCase().replace(/\W/g,'-').replace(/-+/,'-')) + (suffix || '');

  _this.findOne({
    code: possible
  }, function (err, user) {
    if (!err) {
      if (!user) {
        callback(possible);
      } else {
        return _this.findUniqueCode(title, (suffix || 0) + 1, callback);
      }
    } else {
      callback(null);
    }
  });
};

mongoose.model('Project', ProjectSchema);
