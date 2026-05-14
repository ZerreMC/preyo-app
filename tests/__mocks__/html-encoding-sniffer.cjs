'use strict';
// Lightweight CJS stub for html-encoding-sniffer — avoids the @exodus/bytes ESM-only conflict.
// Returns UTF-8 (correct for virtually all test HTML content).
module.exports = function sniff(_buffer, _options) {
    return { name: 'UTF-8', labels: ['utf-8', 'unicode-1-1-utf-8'] };
};
