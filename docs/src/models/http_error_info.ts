/**
 * @file Defines {@link HttpErrorInfo}.
 */

/**
 * {@link Error} to be thrown when there is a need to store a HTTP status code
 * in the {@link Error}.
 */
export default class HttpErrorInfo extends Error {
  /** HTTP error status code. */
  public readonly statusCode: number;

  /**
   * @param statusCode - HTTP error status code.
   * @param message - Error message.
   */
  public constructor(statusCode: number, message?: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
