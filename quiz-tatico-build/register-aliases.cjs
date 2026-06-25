const Module = require('module');
const path = require('path');

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.startsWith('@shared/')) {
    const relativePath = request.slice('@shared/'.length);
    return path.resolve(__dirname, 'shared', relativePath);
  }

  if (request.startsWith('@/')) {
    const relativePath = request.slice('@/'.length);
    return path.resolve(__dirname, 'client', 'src', relativePath);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
