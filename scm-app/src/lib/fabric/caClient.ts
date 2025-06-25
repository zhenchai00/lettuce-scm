import * as fs from "fs";
import * as path from "path";
import FabricCAServices from "fabric-ca-client";

export const buildCAClient = (msp: string) => {
    const caInfo = JSON.parse(
        fs.readFileSync(
            path.resolve(process.cwd(), "src", "config", "fabric", `ca-${msp}.json`),
            "utf8"
        )
    );
    console.log("caClient.ts CA Info:", caInfo);
    const tlsCertPem = fs.readFileSync(
        path.resolve(process.cwd(), caInfo.tlsCertPem.path),
        "utf8"
    );

    return new FabricCAServices(
        caInfo.url,
        {
            trustedRoots: [tlsCertPem],
            verify: false,
        },
        caInfo.caName
    );
};
