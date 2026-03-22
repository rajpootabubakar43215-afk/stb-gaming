import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useOnlineStatus = () => {
  useEffect(() => {
    const updateOnlineStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("online_users")
          .upsert({ user_id: user.id, last_seen: new Date().toISOString() });
      }
    };

    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);
};
