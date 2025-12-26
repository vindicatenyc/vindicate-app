# Quick Spec: Create Tasks from Todo Folder

## Overview
Read tasks from `docs/todo/vindicate-tasks.md` and create them using the TodoWrite tool. This sets up 7 Phase 0 foundational tasks for the Vindicate NYC project.

## Workflow Type
Simple - Single phase task creation workflow

## Task Scope

### Files to Read
- `docs/todo/vindicate-tasks.md` - Contains 7 Phase 0 tasks for Vindicate NYC project

### Tasks Found
1. **Task 0.1**: Clean up repository - restructure project for agent architecture
2. **Task 0.2**: Define core financial models - Pydantic models for transactions
3. **Task 0.3**: Define audit trail models - tracking extraction provenance
4. **Task 0.4**: Define agent interfaces - abstract protocols for any framework
5. **Task 0.5**: Define pipeline data types - data passed between agents
6. **Task 0.6**: Create custom exceptions - consistent error handling
7. **Task 0.7**: Create configuration system - Pydantic Settings for pipeline

### Change Details
Use the TodoWrite tool to create these 7 tasks with status "pending". Each task should have:
- `content`: The imperative task description
- `activeForm`: Present continuous form for display
- `status`: "pending"

## Success Criteria
- [ ] TodoWrite called with all 7 tasks
- [ ] Tasks appear in the todo list
- [ ] Tasks follow dependency order (0.1 first, then 0.2-0.7)
- [ ] Each task has correct content, activeForm, and status fields

## Notes
- Each task is designed for < 2 hours of focused work
- Full task details are in the source file for implementation reference
