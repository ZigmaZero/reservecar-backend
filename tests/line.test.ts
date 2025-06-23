import assert from "assert";
import { describe, it } from "node:test";

// Import the module to be tested
import * as lineService from "../services/lineService.js";

describe("lineService.message test env", () => {
    it("should exit on testing env", async () => {
        const result = await lineService.message("dummyLineId", "Hello!");
        assert.strictEqual(result.success, false);
        assert.strictEqual(result.error, "Sending messages are disabled during testing.")
    })
})