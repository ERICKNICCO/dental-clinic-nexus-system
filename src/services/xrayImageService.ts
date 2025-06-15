
import { supabase } from "@/integrations/supabase/client";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export const xrayImageService = {
  // Upload X-ray images and radiologist's note, then update consultation status and add result to consultation
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
    // 2. Store X-ray result in consultation (Firestore)
    // PATCH consultation with images, note, radiologist, and set status to xray-done
    if (uploadedUrls.length > 0) {
      try {
        const consultRef = doc(db, "consultations", consultationId);
        await updateDoc(consultRef, {
          status: "xray-done",
          xrayResult: {
            images: uploadedUrls,
            note,
            radiologist,
          },
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Error updating consultation with X-ray result:", err);
        throw err;
      }
    }
    return true;
  },
};
