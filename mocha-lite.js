const chalk = require('chalk');

function createDescribeBlock (title) {
  return {
    title: title,
    beforeRunners: [],
    nestedBlocks: [],
    tests: [],
  };
}

function createTest (title, testFn) {
  return {
    title: title,
    testFn: testFn,
  }
}

const rootBlock = createDescribeBlock('Faux-cha testrunner');
rootBlock.failures = [];
let currentBlock = rootBlock;

function describe (title, fn) {
  const nestedBlock = createDescribeBlock(title);
  currentBlock.nestedBlocks.push(nestedBlock);
  previousBlock = currentBlock;
  currentBlock = nestedBlock;
  currentBlock.beforeRunners = previousBlock.beforeRunners.slice();
  fn();
  currentBlock = nestedBlock;
}
function it (title, testFn) {
  currentBlock.tests.push({ title, testFn });
}

function beforeEach (title, beforeFunction) {
  currentBlock.beforeRunners.push({ title, beforeFunction });
}

beforeEach('Root level beforeEach', () => {

});

describe('Outer describe', () => {
  it('does everything', () => {
    throw new Error('It does not do everything!');
  });

  it('is async', (done) => {
    done();
  });

  beforeEach('Outer describe', () => {
    it('works and works and works', () => {
    });
  });

  describe('First inner describe', () => {
    describe('Deeply nested describe', () => {
      it('does this thing', () => {

      });
    });

    it('does another thing', () => {

    });

    it('returns a promise', () => {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, 3000);
      });
    });
  });

  describe('Second inner describe', () => {
    beforeEach('Second inner beforeEach', () => {
    });

    it('is very cool', () => {

    });
  });
});

function buildTestQueue (block, queue = [], indent = '') {
  queue.push({
    isTest: false,
    block, indent
  });
  block.tests.forEach(test => {
    queue.push({
      isTest: true,
      block, test, indent
    });
  });
  if (block.nestedBlocks.length) {
    block.nestedBlocks.forEach(block => buildTestQueue(block, queue, indent + '  '));
  }
  return queue;
}


function executeNextTest (testQueue) {
  return new Promise((resolve, reject) => {
    const nextTest = testQueue.shift();
    if (nextTest) {
      if (nextTest.isTest) {
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
              maybeAPromise.then(() => {
                console.log(chalk.green(`${nextTest.indent} ✔ ${nextTest.test.title}`));
                executeNextTest(testQueue).then(resolve, reject);
              });
              maybeAPromise.catch(() => {
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
          rootBlock.failures.push({ test: nextTest.test, error });
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
const testQueue = buildTestQueue(rootBlock);
executeTestQueue(testQueue).then(() => {
  reportFailures(rootBlock);
});
