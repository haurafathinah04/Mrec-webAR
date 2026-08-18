"use client";

import { useState } from "react";
import { members } from "../../data/members";

export default function ScanPage() {
  const [profile, setProfile] = useState<any>(null);

  const handleScan = () => {
    const detectedMarker = "MREC001";

    setProfile(members[detectedMarker]);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">
        MREC Digital Identity
      </h1>

      <button
        onClick={handleScan}
        className="px-6 py-3 rounded-xl bg-black text-white"
      >
        Scan Dummy Card
      </button>

      {profile && (
        <div className="w-full max-w-md rounded-2xl border p-6 shadow-lg">
          <h2 className="text-2xl font-bold">
            {profile.name}
          </h2>

          <p className="mt-2">
            {profile.position}
          </p>

          <div className="mt-4">
            <h3 className="font-semibold">
              Skills
            </h3>

            <ul className="list-disc ml-5">
              {profile.skills.map((skill: string) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold">
              Projects
            </h3>

            <ul className="list-disc ml-5">
              {profile.projects.map((project: string) => (
                <li key={project}>{project}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}