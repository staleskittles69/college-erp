# Student Portal — TODO

## Web app — features still to finish
_(jot down anything you think is missing or half-done, per portal)_

### Admin
-

### Teacher
-

### Student
-

## Found while working — needs a dedicated look
- **Branches are hardcoded** (`src/lib/academics.ts` → `BRANCHES = ["CSE","ECE","ME","CE","EEE"]`). Should come from the database instead so admin can manage them.
- **"Add student" is broken/duplicated**: `/api/students` POST creates a User with no `rollNumber`, which the schema requires for students — this throws. `/api/admin/create-student` does it correctly but no page in the UI actually calls it. Needs consolidating into one working flow.

## Up next: Android app
Once the web app feels done, build the Android app (Expo/React Native, same backend APIs).
See plan discussed in chat — short version:
1. Install Expo Go on phone
2. `npx create-expo-app student-portal-mobile`
3. Small tweak: login API returns token in response body (not just cookie)
4. Build screens calling existing `/api/...` routes
5. Preview live via `npx expo start` + Expo Go
6. `eas build` to produce a real installable APK later
