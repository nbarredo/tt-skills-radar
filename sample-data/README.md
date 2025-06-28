# Sample Data Files for Smart File Import Testing

This directory contains various sample data files to test the Smart File Import functionality in your Skills Radar system. Each file demonstrates different data formats and entity types that the AI can intelligently analyze and map.

## 📁 Available Sample Files

### 🧪 **test-existing-skills.csv** (Duplicate Detection Test)

**Format:** CSV  
**Entity Type:** Skills  
**Description:** Skills that already exist in the database for testing duplicate detection  
**Test Scenario:** AI should recognize these as existing skills and show "EXISTS" badges instead of "NEW"

**Skills Included:** React, Python, Node, Angular, Vue (all exist in current database)

**Expected Behavior:**

- Records should show **blue "EXISTS" badges** instead of green "NEW" badges
- Should display **"Existing ID: skill-X"** badges showing the matched database IDs
- No **"ID Generated"** badges should appear
- Import should **update existing records** rather than create duplicates

### 1. **members-sample.json**

**Format:** JSON  
**Entity Type:** Members  
**Description:** Sample team member data with skills embedded  
**Test Scenario:** AI should identify this as member data and suggest mapping to the Members entity

**Expected AI Analysis:**

- Primary Entity: Members
- Key Mappings:
  - `full_name` → `fullName`
  - `email` → `corporateEmail`
  - `category` → `category`
  - `location` → `location`
  - `availability` → `availabilityStatus`

### 2. **skills-sample.csv**

**Format:** CSV  
**Entity Type:** Skills  
**Description:** Comprehensive skills catalog with categories and knowledge areas  
**Test Scenario:** AI should recognize this as skills data and map to Skills entity

**Expected AI Analysis:**

- Primary Entity: Skills
- Key Mappings:
  - `skill_name` → `name`
  - `description` → `purpose`
  - `category` → `skillCategoryId` (needs transformation)
  - `knowledge_area` → `knowledgeAreaId` (needs transformation)

### 3. **clients-sample.txt**

**Format:** Text (structured)  
**Entity Type:** Clients  
**Description:** Client information in key-value text format  
**Test Scenario:** AI should parse the structured text and identify client entities

**Expected AI Analysis:**

- Primary Entity: Clients
- Key Mappings:
  - `Client Name` → `name`
  - `Industry` → `industry`
  - `Location` → `location`
  - `Status` → `status`
  - `Description` → `description`

### 4. **member-skills-sample.csv**

**Format:** CSV  
**Entity Type:** MemberSkills (relationships)  
**Description:** Member-to-skill proficiency mappings  
**Test Scenario:** AI should recognize this as relationship data between members and skills

**Expected AI Analysis:**

- Primary Entity: MemberSkills
- Key Mappings:
  - `member_email` → `memberId` (needs lookup)
  - `skill_name` → `skillId` (needs lookup)
  - `proficiency_level` → `proficiencyValue`

### 5. **mixed-data-sample.json**

**Format:** JSON (complex/nested)  
**Entity Type:** Multiple entities  
**Description:** Complex data structure with multiple entity types  
**Test Scenario:** AI should identify multiple entities and suggest the primary one

**Expected AI Analysis:**

- AI should detect multiple entity types within the nested structure
- Should suggest the most prominent entity as primary
- May recommend splitting the import into multiple steps

## 🧪 Testing Instructions

### Step 1: Access Smart File Import

1. Navigate to `/imports` page in your Skills Radar application
2. Find the "Smart File Import" section at the top

### Step 2: Upload and Test Each File

1. **Start Simple:** Begin with `members-sample.json`
2. **Upload the file** and observe AI analysis
3. **Review mappings** in the Field Mapping tab
4. **Check data preview** to ensure parsing is correct
5. **Test import** (or just review without importing)

### Step 3: Progressive Testing

Test files in this order for best learning experience:

1. `members-sample.json` (simple, well-structured)
2. `skills-sample.csv` (CSV format)
3. `clients-sample.txt` (text parsing)
4. `member-skills-sample.csv` (relationship data)
5. `mixed-data-sample.json` (complex, nested)

### Step 4: Test Record Confirmation Feature

The Smart File Import now includes a **Confirm Records** tab with selective import capabilities:

1. **Upload any sample file** and complete the Analysis and Field Mapping steps
2. **Navigate to the "Confirm Records" tab** (4th tab)
3. **Review each record** with the following features:

   - ✅ **Individual checkboxes** for each record
   - 🏷️ **Badge indicators** showing record type (NEW/UPDATE/CONFLICT)
   - 👁️ **Data preview** showing key fields for each record
   - 📊 **Selection counter** showing "X of Y selected"

4. **Test bulk actions:**

   - Click **"Select All"** to enable all records
   - Click **"Select None"** to disable all records
   - **Manually toggle** individual records

5. **Verify import control:**
   - Go to **"Import" tab** (5th tab)
   - Notice the import count shows only **selected records**
   - **Import button is disabled** when no records are selected
   - Only **checked records** will be imported when you proceed

### Step 5: Test Automatic ID Generation

The Smart File Import now automatically generates IDs for records that don't have them:

1. **Upload files without ID fields** (like most sample files)
2. **Check Analysis tab** - you'll see an "ID Generation" notice
3. **Go to Confirm Records tab** - records with generated IDs show an "ID Generated" badge
4. **ID formats vary by entity type:**
   - **Members**: `member_email_timestamp` or `member_name_timestamp`
   - **Skills**: `skill_name_timestamp`
   - **Clients**: `client_name_timestamp`
   - **Generic**: `id_random_timestamp`

**Benefits:**

- ✅ **No import failures** due to missing primary keys
- ✅ **Meaningful IDs** based on data content when possible
- ✅ **Unique identifiers** guaranteed with timestamp component
- ✅ **Visual indicators** showing which records have generated IDs

## 🎯 What to Observe

### AI Analysis Quality

- **Entity Recognition:** Does AI correctly identify the primary entity type?
- **Field Mapping:** Are the suggested mappings logical and accurate?
- **Confidence Scores:** Are high-confidence mappings (>80%) actually correct?
- **Data Quality Issues:** Does AI identify potential problems?

### Edge Cases to Test

- **Missing Data:** Try uploading files with empty fields
- **Different Formats:** Test variations in field names (camelCase vs snake_case)
- **Nested Data:** See how AI handles complex JSON structures
- **Large Files:** Test with files containing many records

## 🔧 Customization

Feel free to modify these sample files to test specific scenarios:

- **Add/Remove Fields:** Test AI's adaptability
- **Change Field Names:** Test mapping flexibility
- **Introduce Errors:** Test error handling
- **Mix Data Types:** Test AI's decision-making

## 📊 Expected Results

After successful import, you should see:

- **New records** added to the appropriate entities
- **Proper relationships** established (for member-skills data)
- **Data validation** ensuring quality
- **Import summary** showing success/error counts

## 🚀 Next Steps

Once you've tested with these samples:

1. **Create your own** sample files based on your real data structure
2. **Test edge cases** specific to your use case
3. **Refine the AI prompts** if needed for better accuracy
4. **Scale up** to larger, real-world data files

---

**💡 Pro Tip:** The AI learns from the context you provide. The more descriptive your field names and the cleaner your data structure, the better the AI will perform in mapping and analysis!
