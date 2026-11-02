import * as React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "a-scene": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        "mindar-image"?: string;
        "color-space"?: string;
        renderer?: string;
        "vr-mode-ui"?: string;
        "device-orientation-permission-ui"?: string;
        embedded?: boolean;
      };
      "a-camera": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        position?: string;
        "look-controls"?: string;
      };
      "a-entity"?: any;
      "a-gltf-model"?: any;
    }
  }
}