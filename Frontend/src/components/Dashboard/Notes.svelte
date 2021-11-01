<script>
  import { flip } from "svelte/animate";
  import Note from "./Note.svelte";
  import AddNote from "./AddNote.svelte";

  let colors = [
    "#ffd8c0",
    "#a1f5cf",
    "#f1bff4",
    "#d9bafd",
    "#a4e2fb",
    "#fdb7b8",
  ];

  let notes = [
    {
      id: 1,
      contentHtml: "Note 1",
      timestamp: 1609455600000,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      orderIndex: 1,
    },
    {
      id: 2,
      contentHtml: "Note 2",
      timestamp: 1609455600000,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      orderIndex: 2,
    },
    {
      id: 3,
      contentHtml: "Note 3",
      timestamp: 1609455600000,
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      orderIndex: 3,
    },
  ];

  const flipDurationMs = 300;

  const onNoteDeleted = (noteId) => {
    notes = notes.filter((note) => note.id !== noteId);
    // TODO db
  };

  const onNoteChanged = (noteId, changedContentHtml) => {
    const note = notes.find((note) => note.id === noteId);
    note.timestamp = new Date().getTime();
    note.contentHtml = changedContentHtml;
    notes = [...notes];
    console.log("changed: " + noteId);
    // TODO db
  };

  const onNoteDrop = (event, dragEndIndex) => {
    event.dataTransfer.dropEffect = "move";
    const dragStartIndex = parseInt(event.dataTransfer.getData("text/plain"));
    const draggedNote = notes[dragStartIndex];
    notes[dragStartIndex] = notes[dragEndIndex];
    notes[dragEndIndex] = draggedNote;
    notes.forEach((note, i) => (note.orderIndex = i));
    notes = [...notes];
  };

  const onNoteDragStart = (event, i) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.dropEffect = "move";
    const startIndex = i;
    event.dataTransfer.setData("text/plain", startIndex);
  };
</script>

<div class="notescontainer">
  <div class="notescontainerheader">Notizen</div>
  <div class="notescontainercontent">
    {#each notes as note, index (note.id)}
      <div
        animate:flip={{ duration: flipDurationMs }}
        draggable={true}
        on:dragstart={(event) => onNoteDragStart(event, index)}
        on:drop|preventDefault={(event) => onNoteDrop(event, index)}
        ondragover="return false"
      >
        <Note
          contentHtml={note.contentHtml}
          timestamp={note.timestamp}
          backgroundColor={note.backgroundColor}
          on:delete={(e) => onNoteDeleted(note.id)}
          on:change={(e) => onNoteChanged(note.id, e.detail)}
        />
      </div>
    {/each}
    <AddNote />
  </div>
</div>

<style>
  .notescontainer {
    display: flex;
    flex-direction: column;
    background-color: white;
    --note-width: 18rem;
  }

  .notescontainerheader {
    font-size: 1.7rem;
    padding: 1rem 1rem 0 1rem;
    font-weight: bold;
  }

  .notescontainercontent {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  }
</style>
