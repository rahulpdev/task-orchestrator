# Writing standard for planning documents

## Philosophy

This standard is for the documents that plan and hand over software: blueprints, PRDs, architecture documents, research references and operating guides. Their principal reader is the agency's non-technical owner. Every sentence must be understood on first reading, and every claim must be traceable.

## How to use this file

- A command or prompt that applies this standard names this file by its path and reads it in full before writing.
- If the file is not found at that path, the command stops and asks for it. It does not continue on a remembered or assumed version of the standard.
- A standard set in the conversation for one document overrides this file for that document. Say so in the report.
- The **Standard** section says how the prose must read. The **Verification** section says how to check it before delivery. A command that writes a document applies both.

## Standard

### Reader

Write for the agency's non-technical owner, at about a 16-year-old reading level and new to the subject. Assume intelligence, not background. The AI coding agents that build from the document are the second reader, and if the owner can understand it, so can they.

### Sentences

- Use plain, direct English. Prefer the everyday word to the technical one. Where a technical term is required, explain what it means in everyday words in brackets immediately after the term, the first time the reader meets it, never in a separate table or list. Use that exact term every time afterwards, never a shortened form or a substitute phrase for it.
- Keep sentences short, with one main idea each. About 25 words is the ceiling; a sentence over it needs a reason.
- Do not join clauses with semicolons, dashes or arrows. Start a new sentence instead.
- Do not pack a list of settings, fields or facts into one sentence. A list of more than three items becomes bullets.

### Paragraphs

- One main idea per paragraph. A paragraph that needs a second idea becomes two paragraphs, or a bulleted list.
- Make each step explicit. The reader should never have to infer a step the writer skipped.

### Length

Keep the document as short as its purpose allows without leaving out a necessary fact. Cut by removing, not by compressing several facts into one sentence.

### Claims

- State facts as facts and assumptions as assumptions. Label which is which where the reader could confuse them.
- Keep every qualification that carries meaning, such as a threshold, a region, a version or a condition. A qualification is not a hedge.
- Do not hedge about your own uncertainty inside a sentence. Put what is unknown in the place the document provides for it, such as an open question, an assumption or a TBD.

### Structure

- Use bullets for parallel items and prose for a line of argument.
- Use a table only when the reader will compare rows.
- Keep code, field names and commands out of prose where a plain description will do. Where a name is needed, use it exactly and at most once or twice per paragraph.

## Verification

Complete both reviews before delivering. They are separate passes with different questions.

### Accuracy review

Check every material claim against the available evidence. Confirm that qualifications survived drafting, that facts and assumptions are still distinguished, and that whatever remains uncertain is stated as uncertain.

### Writing review

Read the whole document as someone new to the subject would. Give this review to someone who took no part in drafting. Rewrite any passage that needs rereading, carries too many ideas, or makes the reader infer a missing step.

### Defined-term check

List every technical term the document uses. Check that each is explained in everyday words in brackets immediately after its first appearance. Search the document for each one and for its likely shortened forms or substitute phrases. Where one appears, such as "the log" for "the error log", restore the term. A term is explained once and then used exactly.

### Single-statement check

List every fact, decision or rule that the document states in more than one place. Keep each in the one place a reader would look for it, and replace the other statements with a reference to that place or with nothing. A table whose purpose is to summarise, such as a requirements or risk table, may restate what the body explains, and a glossary never may.

### Mechanical prompt

Find every prose sentence over 25 words and every paragraph that feels crowded. Shorten or reorganise each one unless its length is needed for accuracy. The count is a prompt, not proof. A sentence under the limit can still fail the writing review, and a sentence over it may be right.

### Exceptions

Where a rule cannot be met without losing precision, keep the precise form and name the exception in the report, with the reason. Do not claim full compliance on the strength of a mechanical check.
