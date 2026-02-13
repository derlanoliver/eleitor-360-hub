import { useEffect } from "react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { initFacebookPixel, initGTM } from "@/lib/trackingUtils";

interface TrackingProviderProps {
  children: React.ReactNode;
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  const { data: settings } = useAppSettings();

  useEffect(() => {
    if (!settings) return;

    // Initialize custom pixel code (takes priority)
    if (settings.facebook_pixel_code) {
      try {
        // Parse and inject script tags and inline code
        const container = document.createElement('div');
        container.innerHTML = settings.facebook_pixel_code;
        
        // Handle <script> tags with src attributes
        const scripts = container.querySelectorAll('script');
        scripts.forEach((script) => {
          const newScript = document.createElement('script');
          if (script.src) {
            newScript.src = script.src;
            newScript.async = true;
          } else {
            newScript.innerHTML = script.innerHTML;
          }
          document.head.appendChild(newScript);
        });

        // If no script tags found, try injecting as raw script
        if (scripts.length === 0) {
          const scriptElement = document.createElement('script');
          scriptElement.innerHTML = settings.facebook_pixel_code;
          document.head.appendChild(scriptElement);
        }

        console.log('Custom Facebook Pixel code loaded');
      } catch (error) {
        console.error('Error loading custom Facebook Pixel code:', error);
      }
    } else if (settings.facebook_pixel_id) {
      // Use standard initialization only if no custom code
      initFacebookPixel(settings.facebook_pixel_id);
    }

    // Initialize Google Tag Manager
    if (settings.gtm_id) {
      initGTM(settings.gtm_id);
    }
  }, [settings]);

  return <>{children}</>;
}
