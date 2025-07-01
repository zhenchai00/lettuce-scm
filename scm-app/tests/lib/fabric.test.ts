// tests/lib/fabric.test.ts
import { fabricConfig } from "@/config/fabric-config";

describe("getFabricService()", () => {
  it("initializes connection on first call", async () => {
    await jest.isolateModulesAsync(async () => {
      const { getFabricService, _fabricGatewayService } = require("@/lib/fabric");
      const { FabricGatewayService } = require("@/lib/fabric-gateway-service");

      const spy = jest
        .spyOn(FabricGatewayService.prototype, "connect")
        .mockResolvedValueOnce(undefined);

      (_fabricGatewayService as any).contract = null;
      const svc = await getFabricService();

      expect(spy).toHaveBeenCalledWith(fabricConfig.USER_IDENTITY);
      expect(svc).toBe(_fabricGatewayService);
    });
  });

  it("returns cached service if already connected", async () => {
    await jest.isolateModulesAsync(async () => {
      const { getFabricService, _fabricGatewayService } = require("@/lib/fabric");
      (_fabricGatewayService as any).contract = {}; // already connected

      const svc1 = await getFabricService();
      const svc2 = await getFabricService();
      expect(svc1).toBe(svc2);
    });
  });

  it("awaits in‑flight connection", async () => {
    await jest.isolateModulesAsync(async () => {
      const { getFabricService, _fabricGatewayService } = require("@/lib/fabric");
      const { FabricGatewayService } = require("@/lib/fabric-gateway-service");

      (_fabricGatewayService as any).contract = null;

      const connectPromise = new Promise<void>((r) => setTimeout(r, 10));
      const spy = jest
        .spyOn(FabricGatewayService.prototype, "connect")
        .mockReturnValueOnce(connectPromise as any);

      // two concurrent calls will share the same promise
      await Promise.all([getFabricService(), getFabricService()]);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it("rethrows and resets on connect failure", async () => {
    await jest.isolateModulesAsync(async () => {
      const { getFabricService, _fabricGatewayService } = require("@/lib/fabric");
      const { FabricGatewayService } = require("@/lib/fabric-gateway-service");

      (_fabricGatewayService as any).contract = null;
      // stub connect to reject
      jest
        .spyOn(FabricGatewayService.prototype, "connect")
        .mockRejectedValueOnce(new Error("boom"));

      await expect(getFabricService()).rejects.toThrow("boom");

      // after failure, calling again should attempt a fresh connect
      const spy2 = jest
        .spyOn(FabricGatewayService.prototype, "connect")
        .mockResolvedValueOnce(undefined);

      const svc = await getFabricService();
      expect(spy2).toHaveBeenCalled();
      expect(svc).toBe(_fabricGatewayService);
    });
  });
});
