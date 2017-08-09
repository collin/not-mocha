const chalk = require('chalk');

class DescribeBlock {
  constructor ({title}) {
    this.title = title;

    this.beforeEachRunners = [];
    this.afterEachRunners = [];

    this.beforeRunners = [];
    this.afterRunners = [];

    this.nestedBlocks = [];
    this.tests = [];
  }

  begetNestedBlock ({title}) {
    const nestedBlock = new DescribeBlock({title});
    this.nestedBlocks.push(nestedBlock);

    nestedBlock.beforeEachRunners = this.beforeEachRunners.slice();
    nestedBlock.afterEachRunners = this.afterEachRunners.slice();

    nestedBlock.beforeRunners = this.beforeRunners.slice();
    nestedBlock.afterRunners = this.afterRunners.slice();

    return nestedBlock;
  }
}

class TestBlock {
  constructor ({ title, testFn}) {
    this.title = title;
    this.testFn = testFn;
  }
}

class CallbackBlock {
  constructor (title, callbackFn) {
    this.title = title;
    this.callbackFn = callbackFn;
  }
}

class TestDefinition {
  constructor ({title, testFn}) {
    this.title = title;
    this.testFn = testFn;
  }
}

class TestResult {
}

class Results {
  constructor () {
    this.results = [];
  }
}

class RunQueue {

}

const rootBlock = new DescribeBlock({title: 'Faux-cha testrunner'});
rootBlock.failures = [];
let currentBlock = rootBlock;

function describe (title, blockFn) {
  previousBlock = currentBlock;
  currentBlock = previousBlock.begetNestedBlock({title});
  blockFn();
  currentBlock = previousBlock;
}

function it (title, testFn) {
  currentBlock.tests.push(new TestDefinition({ title, testFn }));
}

function beforeEach (title, runner) {
  currentBlock.beforeEachRunners.push({ title, runner });
}

function afterEach (title, runner) {
  currentBlock.afterEachRunnersopush({ title, runner });

}

function after (title, runner) {
  currentBlock.afterRunners.push({ title, runner });
}

function before (title, runner) {
  currentBlock.beforeRunners.push({ title, runner });
}

function buildTestQueue (block, queue = [], indent = '') {
  queue.push({ block, indent });
  block.tests.forEach(test => {
    queue.push({ block, test, indent });
  });
  if (block.nestedBlocks.length) {
    block.nestedBlocks.forEach(nested => buildTestQueue(nested, queue, indent + '  '));
  }
  return queue;
}

function executeNextTest (testQueue) {
  return new Promise((resolve, reject) => {
    const nextTest = testQueue.shift();
    if (nextTest) {
      function captureFailure (error) {
        rootBlock.failures.push({ test: nextTest.test, error });
      }
      if (nextTest.test) {
        try {
          nextTest.block.beforeRunners.forEach(runner => runner.beforeFunction());
          function doneCallback () {
            console.log(chalk.green(`${nextTest.indent} ✔ ${nextTest.test.title}`));
            executeNextTest(testQueue).then(resolve, reject);
          }
          if (nextTest.test.testFn.length === 1) {
            nextTest.test.testFn(doneCallback);
          }
          else {
            const maybeAPromise = nextTest.test.testFn();
            if (maybeAPromise && maybeAPromise.then && maybeAPromise.catch) {
              maybeAPromise
                .then(() => {
                  console.log(chalk.green(`${nextTest.indent} ✔ ${nextTest.test.title}`));
                  executeNextTest(testQueue).then(resolve, reject);
                })
                .catch((error) => {
                  captureFailure(error);
                  rootBlock.failures.push({ test: nextTest.test, error });
                  console.log(chalk.red(`${nextTest.indent} ✘ ${nextTest.test.title}`));
                  executeNextTest(testQueue).then(resolve, reject);
                });
            }
            else {
              console.log(chalk.green(`${nextTest.indent} ✔ ${nextTest.test.title}`));
              executeNextTest(testQueue).then(resolve, reject);
            }
          }
        }
        catch (error) {
          captureFailure(error);
          console.log(chalk.red(`${nextTest.indent} ✘ ${nextTest.test.title}`));
          executeNextTest(testQueue).then(resolve, reject);
        }
      }
      else {
        console.log(`${nextTest.indent} > ${chalk.underline(nextTest.block.title)}`);
        executeNextTest(testQueue).then(resolve, reject);
      }
    }
    else {
      resolve();
    }
  });
}

function executeTestQueue (testQueue) {
  return new Promise((resolve, reject) => {
    executeNextTest(testQueue).then(resolve);
  });
}

function reportFailures (block) {
  rootBlock.failures.forEach((failure, index) => {
    console.log('');
    console.log('');
    console.log(chalk.red(`${index + 1}) Test ${failure.test.title} failed`));
    console.error(failure.error);
  });
}
module.exports = {
  run () {
    const testQueue = buildTestQueue(rootBlock);
    executeTestQueue(testQueue)
      .then(() => {
        reportFailures(rootBlock);
      })
      .catch((error) => {
        console.log('Internal error while running tests.');
        console.error(error);
      });
  }
}

global.it = it;
global.describe = describe;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.before = before;
global.after = after;
