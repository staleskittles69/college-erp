# Student Portal — TODO

## Web app — features still to finish
_(jot down anything you think is missing or half-done, per portal)_

### Admin
- At-risk students page: two tables (Low Attendance, Low CGPA), thresholds configurable by admin, filterable by branch/year/section. Pure code (aggregation over Attendance + Marks), no AI needed.
- Notices: add `audience` field (students/teachers/both) so admin announcements can also reach teachers, not just students.
- Messages panel: view + mark-as-read for messages sent in by teachers (see Teacher section below).

### Teacher
- "Message Admin" form + sent-message history (new `TeacherMessage` model: sender, body, read/unread) — pairs with the admin Messages panel above.

### Student
-

## Found while working — needs a dedicated look
- **Branches are hardcoded** (`src/lib/academics.ts` → `BRANCHES = ["CSE","ECE","ME","CE","EEE"]`). Should come from the database instead so admin can manage them.
- ~~"Add student" is broken/duplicated~~ — **fixed**: `/api/students` POST now sets `rollNumber`/`branch`/`year` on the User properly (auto-generated, scoped per branch+year) and hashes the password. Deleted the unused duplicate `/api/admin/create-student` route. Also swapped the form's own hardcoded branch list (`MECH/CIVIL/IT`, which didn't match branches used anywhere else) for the shared one.

## Up next: Android app
Once the web app feels done, build the Android app (Expo/React Native, same backend APIs).
See plan discussed in chat — short version:
1. Install Expo Go on phone
2. `npx create-expo-app student-portal-mobile`
3. Small tweak: login API returns token in response body (not just cookie)
4. Build screens calling existing `/api/...` routes
5. Preview live via `npx expo start` + Expo Go
6. `eas build` to produce a real installable APK later
