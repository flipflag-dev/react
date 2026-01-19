export const FlipFlag = jest.fn().mockImplementation(() => {
  return {
    init: jest.fn().mockResolvedValue(undefined),
    isEnabled: jest.fn().mockReturnValue(false),
    destroy: jest.fn(),
  };
});
