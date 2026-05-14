'use strict';
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
// Preloaded via --require in vitest forks poolOptions to intercept html-encoding-sniffer
// before jsdom loads it. html-encoding-sniffer@6 does require('@exodus/bytes') which is
// ESM-only and breaks CJS workers. This stub returns UTF-8 for all inputs.
const Module = require('module');
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
    if (request.includes('html-encoding-sniffer') && !request.includes('preload-sniffer-patch')) {
        return function sniff(_buffer, _options) {
            return { name: 'UTF-8', labels: ['utf-8', 'unicode-1-1-utf-8'] };
        };
    }
    return originalLoad.apply(this, arguments);
};
