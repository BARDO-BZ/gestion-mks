"use client";

import Image from "next/image";
import { Tabs, Tab } from "@heroui/tabs";
import { RestorePassword } from "@/features/users/components";

export default function Home() {
  return (
    <div className="flex flex-col items-center mt-[5%] gap-12">
      <Image
        src="/logo.png"
        width={200}
        height={500}
        alt="MKS - Protección radiológica"
      />
      <div className="w-full max-w-md mx-auto">
        <Tabs
          aria-label="Options"
          className="w-full"
          classNames={{
            base: "w-full",
            tabList: "w-full !flex",
            panel: "w-full p-0",
          }}
        >
          <Tab key="restore-password" title="Reestablecer contraseña">
            <RestorePassword />
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
