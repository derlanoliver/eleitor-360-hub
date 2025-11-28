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

    // Initialize Facebook Pixel
    if (settings.facebook_pixel_id) {
      // Check if custom pixel code is provided
      if (settings.facebook_pixel_code) {
        try {
          // Execute custom pixel code
          const scriptElement = document.createElement('script');
          scriptElement.innerHTML = settings.facebook_pixel_code;
          document.head.appendChild(scriptElement);
          console.log('Custom Facebook Pixel code loaded');
        } catch (error) {
          console.error('Error loading custom Facebook Pixel code:', error);
          // Fallback to standard initialization
          initFacebookPixel(settings.facebook_pixel_id);
        }
      } else {
        // Use standard initialization
        initFacebookPixel(settings.facebook_pixel_id);
      }
    }

    // Initialize Google Tag Manager
    if (settings.gtm_id) {
      initGTM(settings.gtm_id);
    }
  }, [settings]);

  return <>{children}</>;
}
