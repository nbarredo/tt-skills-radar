# Excel Import Guide

## Overview

The TT Skills Radar application now supports importing skills data from Excel files. The system can process the provided "Bootcamp - skills.xlsx" file and automatically:

1. Create members based on email addresses
2. Create skills if they don't exist
3. Assign skills to members with proficiency levels
4. Create default entities (Knowledge Areas, Skill Categories, Scales) if needed

## File Structure Expected

### Skills Import (`ExcelImport` component)

The Excel file should contain the following columns:

- **Date**: Date of the skill assessment (Excel date format)
- **Email**: Corporate email of the member
- **Skill**: Name of the skill (e.g., "Technologies [React]")
- **Expertise Full Name**: Proficiency level description

#### Supported Expertise Levels

The system maps expertise levels to numeric values (1-5):

- `(1) I don't know` → 1
- `(2) I know but didn't use it / Just tried it out / Used it once or twice` → 2
- `(3) I know well, used it several times` → 3
- `(4) I have wide knowledge, I can be reference for others` → 4
- `(5) I'm an expert, I can teach others` → 5

#### Handling Missing or Custom Expertise Levels

The system intelligently handles various expertise level formats:

**Missing/Undefined Values:**

- Open-ended questions (e.g., "Please share any other...") with no response are skipped
- Skills with missing expertise levels get assigned a default level of 2 (basic knowledge)

**Custom Descriptions:**
The system uses keyword matching to infer proficiency levels:

- **Level 4**: Contains "expert", "reference", "senior", "wide knowledge"
- **Level 3**: Contains "know well", "several times", "experience"
- **Level 2**: Contains "used", "tried", "intermediate"
- **Level 1**: Default for unmatched descriptions

## How to Use

### 1. Access the Import Feature

1. Navigate to the Dashboard
2. Scroll down to the "Import Data" section
3. Click "Import Skills from Excel"

### 2. Upload Your Excel File

1. Click "Choose Excel File" or use the "Download Template" to see the expected format
2. Select your Excel file (the provided "Bootcamp - skills.xlsx" works perfectly)
3. The system will validate the file and show a preview

### 3. Review and Import

1. Review the import summary showing:
   - Number of skill records found
   - Number of unique members
   - Number of unique skills
2. Click "Import X Records" to proceed
3. The system will process the data and show results

## What Happens During Import

### Member Creation

- For each unique email in the Excel file:
  - If the member doesn't exist, creates a new member with:
    - Full name derived from email (e.g., "john.doe@company.com" → "John Doe")
    - Default hire date (current date)
    - Default category ("Starter")
    - Default location ("Unknown")
    - Default availability ("Available")
  - Creates a member profile with basic contact information

### Skill Creation

- For each unique skill mentioned:
  - If the skill doesn't exist, creates it with:
    - Name from the Excel file
    - Purpose: "Imported from Excel"
    - Linked to default Knowledge Area ("Technologies")
    - Linked to default Skill Category ("Technical Skills")

### Default Entities

If your system doesn't have these entities, they'll be created automatically:

- **Knowledge Area**: "Technologies" - Technical skills and technologies
- **Skill Category**: "Technical Skills" - Technical proficiency and experience
- **Scale**: "Proficiency Level" - Numeric scale with values 1-5

### Skill Assignments

- Creates MemberSkill records linking members to skills
- Maps expertise levels to proficiency values
- Uses the default scale for all assignments

## Import Results

After import, you'll see:

- Number of members created vs. updated
- Number of skills created
- Number of skill assignments created
- Any errors encountered during the process

## Tips for Success

1. **File Format**: Use `.xlsx` or `.xls` files
2. **Column Names**: Ensure exact column names: "Date", "Email", "Skill", "Expertise Full Name"
3. **Data Quality**:
   - Email addresses should be valid
   - Skills should have meaningful names
   - Expertise levels should match the supported formats
4. **Large Files**: The system shows the first 100 records for preview but imports all data
5. **Existing Data**: The system handles existing members gracefully (updates vs. creates)

## Troubleshooting

### Common Issues:

- **File not reading**: Ensure it's a valid Excel file
- **Missing columns**: Check column names match exactly
- **Validation errors**: Review the error messages for specific row issues
- **Import failures**: Check the detailed error messages in the results

### Data Cleanup:

If you need to clean up imported data:

1. Use the individual entity management pages (Members, Skills, etc.)
2. Delete unwanted records manually
3. Re-import with corrected data if needed

## Using the Imported Data

Once imported, you can:

1. View members on the Dashboard with their skills
2. Filter members by skills, knowledge areas, etc.
3. Edit member profiles and add more information
4. Manage skills and proficiency levels
5. Create reports and visualizations

The imported data integrates seamlessly with all existing application features.
