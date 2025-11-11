# Phase 7: Resources, Search & Event Details

## 🎯 Goals

Enhance community functionality with:
1. **Resources Tab** - Share and organize useful content
2. **Advanced Search** - Find communities and content easily
3. **Event Detail View** - Rich event information and RSVP management

---

## 📋 Phase 7A: Resources Tab

### Features:
- **Links Collection**
  - Add/edit/delete links
  - Link title, URL, description
  - Thumbnail preview
  - Categories/tags
  - Vote/favorite links

- **File Storage**
  - Upload files (PDFs, docs, images)
  - File size limits
  - Download files
  - File categories
  - Search files

- **Permissions**
  - Admins/moderators can add resources
  - Members can view and download
  - Optional: Members can suggest resources

### Database Schema:
```sql
-- resources table
- id, community_id, type (link/file), title, description
- url (for links), file_url (for files), file_size, file_type
- created_by, created_at, category

-- resource_categories table (optional)
- id, name, icon, color
```

### UI Components:
- ResourceTab screen
- ResourceCard component
- AddResourceModal component
- FileUploadModal component

---

## 📋 Phase 7B: Advanced Search

### Features:
- **Full-Text Search**
  - Search communities by name/description
  - Search posts within communities
  - Search events
  - Search members

- **Search Filters**
  - Filter by type (communities, posts, events, members)
  - Filter by category
  - Filter by date
  - Sort options

- **Search History**
  - Save recent searches
  - Clear history
  - Quick access to previous searches

- **Search UI**
  - Search bar with autocomplete
  - Filter chips
  - Results grouped by type
  - Empty states

### Database Schema:
```sql
-- search_history table
- id, user_id, query, type, created_at

-- Use Supabase full-text search on existing tables
```

### UI Components:
- SearchScreen
- SearchBar component
- SearchFilters component
- SearchResults component

---

## 📋 Phase 7C: Event Detail View

### Features:
- **Event Detail Screen**
  - Full event information
  - Large event image
  - Date, time, location
  - Full description
  - Creator info

- **Attendees List**
  - See who's going
  - Filter by RSVP status (going/maybe)
  - Attendee avatars and names
  - Attendee count

- **RSVP Actions**
  - Large RSVP buttons
  - Change RSVP status
  - RSVP confirmation
  - Share event

- **Additional Info**
  - Add to calendar
  - Get directions (if location)
  - Share with friends
  - Event updates/comments

### Navigation:
- Tap event card → Navigate to detail screen
- Modal or full screen presentation

### UI Components:
- EventDetailScreen
- AttendeesList component
- RSVPButtons component

---

## 🚀 Implementation Order

### Week 1: Resources Tab
- [ ] Database schema
- [ ] API functions (CRUD)
- [ ] Resources tab UI
- [ ] Link management
- [ ] File upload
- [ ] Test and polish

### Week 2: Advanced Search
- [ ] Search API
- [ ] Full-text search setup
- [ ] Search screen UI
- [ ] Filters and history
- [ ] Test and polish

### Week 3: Event Details
- [ ] Event detail screen
- [ ] Attendees list
- [ ] Enhanced RSVP
- [ ] Navigation updates
- [ ] Test and polish

---

## 📊 Complexity Assessment

| Feature | Complexity | Impact | Priority |
|---------|-----------|--------|----------|
| Resources Tab | Medium | High | 1 |
| File Upload | Medium-High | High | 1 |
| Advanced Search | Medium | High | 2 |
| Search History | Low | Medium | 2 |
| Event Details | Low-Medium | High | 3 |
| Attendees List | Low | Medium | 3 |

---

## 🎨 Design Notes

**Resources Tab:**
- Icon: 📚 or 📁
- Position: After Events tab
- Layout: List view with cards
- Actions: FAB for adding resources

**Search:**
- Global search bar at top
- Recent searches as chips
- Results in sections
- Smooth animations

**Event Details:**
- Hero image at top
- Tabs for Description/Attendees/Updates
- Sticky RSVP buttons
- Beautiful typography

---

## 🔧 Technical Considerations

1. **File Storage:**
   - Use Supabase Storage
   - Set file size limits (10MB?)
   - Handle different file types
   - Virus scanning (optional)

2. **Search:**
   - Use Supabase full-text search
   - Index relevant columns
   - Debounce search input
   - Cache results

3. **Performance:**
   - Lazy load attendees
   - Image optimization
   - Pagination for resources

---

Ready to start building! 🚀

