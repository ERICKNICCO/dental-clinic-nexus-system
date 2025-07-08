import { supabase } from "@/integrations/supabase/client";

export const xrayImageService = {
  // Upload X-ray images and update consultation status
  async uploadXrayResult(consultationId: string, files: File[], note: string, radiologist: string) {
    // 1. Upload images to storage
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const filePath = `xray/${consultationId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("xray-images")
        .upload(filePath, file);
      if (error) throw error;
      const publicUrl = supabase.storage.from("xray-images").getPublicUrl(filePath).data.publicUrl;
      uploadedUrls.push(publicUrl);
    }
    // 2. Store X-ray result in consultation (Supabase)
    // PATCH consultation with images and set status to xray-done
    if (uploadedUrls.length > 0) {
      try {
        // Use Supabase to update the consultation record
        const { error } = await supabase
          .from('consultations')
          .update({
            status: "xray-done",
            xray_result: {
              images: uploadedUrls,
              note: note, // Use the provided note, or you can keep it empty if always empty
              radiologist: radiologist,
            },
            updated_at: new Date().toISOString(), // Use ISO string for Supabase timestamp
          })
          .eq('id', consultationId);

        if (error) {
          console.error("Error updating consultation with X-ray result in Supabase:", error);
          throw error;
        }
      } catch (err) {
        console.error("Error updating consultation with X-ray result:", err);
        throw err;
      }
    }
    return true;
  },
};
