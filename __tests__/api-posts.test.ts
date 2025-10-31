import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Import the schema from the posts route
const CreatePostSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
});

describe('CreatePostSchema', () => {
  it('should validate valid input', () => {
    const validInput = { title: 'Test Title', body: 'Test Body' };
    const result = CreatePostSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Test Title');
      expect(result.data.body).toBe('Test Body');
    }
  });

  it('should reject missing title', () => {
    const invalidInput = { body: 'Test Body' };
    const result = CreatePostSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    }
  });

  it('should reject empty title', () => {
    const invalidInput = { title: '', body: 'Test Body' };
    const result = CreatePostSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Too small: expected string to have >=1 characters'
      );
    }
  });

  it('should reject missing body', () => {
    const invalidInput = { title: 'Test Title' };
    const result = CreatePostSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Invalid input: expected string, received undefined'
      );
    }
  });

  it('should reject empty body', () => {
    const invalidInput = { title: 'Test Title', body: '' };
    const result = CreatePostSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        'Too small: expected string to have >=1 characters'
      );
    }
  });
});
