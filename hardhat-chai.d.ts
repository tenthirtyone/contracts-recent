declare module 'chai' {
  global {
    namespace Chai {
      interface Assertion {
        reverted: AsyncAssertion;
        revertedWith: (reason: string | RegExp) => AsyncAssertion;
      }
    }
  }
}
