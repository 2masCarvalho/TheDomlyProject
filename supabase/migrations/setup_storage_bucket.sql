-- Create a public storage bucket for condominium images
INSERT INTO storage.buckets (id, name, public)
VALUES ('condominio-images', 'condominio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the bucket
-- Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'condominio-images' );

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'condominio-images' );

-- Allow authenticated users to update their own images (optional, but good practice)
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'condominio-images' );

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'condominio-images' );
