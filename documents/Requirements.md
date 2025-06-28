Techie Skills Radar
Purpose
The talent we have is the fuel for our value proposition and the services we offer to our clients. Knowing and keeping updated the status of the talent we concentrate is key to articulating the sale of what we can do. At the same time, it allows us to identify areas of knowledge where we can strengthen our capabilities and align them with the professional development needs of each Techie. We need a mechanism that allows us to register, consult, and keep updated the talent status of our Techies to be able to react quickly to client and labor market demand.
Objective
To have a tool that facilitates:
•	All Techies registering and keeping their knowledge and skills updated.
•	The sales team consulting the experience levels we have by knowledge area to know how well positioned we are to satisfy client demand.
•	The Solutions team identifying areas of opportunity to strengthen knowledge and skills the company needs.
•	The People team identifying areas of opportunity to articulate professional development programs.
Examples of profile queries:
(Image of a profile for "John Garcia" showing contact information, social connections, skills, badges, certifications, assessments, and an "About Me" section.)
(Image of an "Assessment Profile" for "Ryan Walker" showing a score analysis for "Advance Java" with a total score, time taken, and a breakdown of proficiency levels for "Core Java," "JEE," "Hibernate," and "SQL Queries.")
Use Cases
•	In the sales area, I want to know how many people know a certain technology or possess certain skills and are available (now or soon), so I can adjust my conversations with clients to close deals faster.
•	In the sales area, I want to know which knowledge areas we have the most talent and experience in, so I can adjust my presentations of Techie Talent as a solution provider to potential clients.
•	In the Solutions area, I want to know who the reference people are by knowledge area according to their experience, so I can articulate professional development programs.
•	In the Solutions area, I want to know which knowledge areas we have less talent or experience in, to assess the need to seek more business opportunities in them or develop training and professional development programs.
•	In the People area, I want to know a person's career path to understand if their interests are aligned with their current assignment or with opportunities in other accounts.
•	In the People area, I want to know a person's career path and their interests to identify potential professional development points.
•	In the Production area, I want to know the profiles of other colleagues and their interests to connect with them (exchange knowledge and experiences, learn, ask for help, etc.).
Requirements
CRUD for Knowledge Area
Attributes of a Knowledge Area:
•	Identifier
•	Area Name (E.g., Project Management, Product Management, Programming, Data Engineering, Design, Cloud Computing, etc.)
•	Area Description (types of problems addressed in this area, key skills needed, etc.)
CRUD for Skill Category
Attributes of a Category:
•	Identifier
•	Category Name (E.g., Tools, Languages, Processes, Human abilities, etc.) 
•	Criterion (characteristics by which skills are grouped in this Category) 
CRUD for Skill
Attributes of a Skill:
•	Identifier
•	Skill Name (E.g., Java, Azure, PowerBI, Cypress, etc.)
•	Purpose (what this skill is used for, what problems it solves)
CRUD for Scale
A Scale is a rating scale for measurement.
Attributes:
•	Identifier
•	Name
•	Type (E.g., Numeric, Qualitative) 
•	Values (depending on the type, can be numbers -1 to 5-, qualifiers -bad, regular, good-, literals -A, B, C-, etc.) 
CRUD for Member
A Member is a Techie.
Attributes:
•	TT corporate email
•	Full name
•	Hire date
•	Current assigned client
•	Category (Starter, Builder, Solver, Wizard)
•	Location
Import Members (from Excel)
Integrate with external Techie Talent data sources (e.g., Datamaster)
CRUD for Member Profile
Attributes of the Profile:
•	List of assignments 
•	Roles and tasks a person can take on in a team 
•	Appreciations from clients (can be obtained by integrating with Techie Points) 
•	Feedback comments 
•	Periods in Talent Pool 
Dashboard
•	List members filtered by Name, Knowledge Area, Category, Skill, and Assigned Client
•	List member profiles by client’s history (like, all people who had ever worked for Lunavi)
•	List skills by Techie Category (like, all people that are Solvers)

