-- Fix infinite recursion in user_profiles RLS policies
-- Drop the problematic policies
DROP POLICY IF EXISTS "Super users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Super users can update all profiles" ON user_profiles;

-- Recreate policies using the is_super_user() function to avoid recursion
CREATE POLICY "Super users can view all profiles" 
ON user_profiles 
FOR SELECT 
USING (is_super_user() OR id = auth.uid());

CREATE POLICY "Super users can update all profiles" 
ON user_profiles 
FOR UPDATE 
USING (is_super_user() OR id = auth.uid());