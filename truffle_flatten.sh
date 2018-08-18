#!/usr/bin/env bash

node ./node_modules/.bin/truffle-flattener ./contracts/TokenSwap.sol > ./contracts-flat/FLAT-TokenSwap.sol;
