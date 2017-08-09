describe('Outer describe', () => {
  it('does everything', () => {
    throw new Error('It does not do everything!');
  });

  it('is async', (done) => {
    done();
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
        setTimeout(resolve, 100);
      });
    });

    it('fails with promise rejection', () => {
      return new Promise((resolve, reject) => {
        setTimeout(() => { reject(new Error('This promise has been rejected')); }, 100);
      });
    });
  });

  describe('Second inner describe', () => {
    beforeEach('Second inner beforeEach', () => {
    });

    it('is very cool', () => {
      throw new Error('This is not very cool');
    });
  });
});
