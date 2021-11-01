<script>
  import { flip } from "svelte/animate";
  import { dndzone } from "svelte-dnd-action";
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

  const onNoteOrderUpdated = (notesWithUpdatedOrder, persist = false) => {
    notesWithUpdatedOrder.forEach(
      (noteWithUpdatedOrder, i) => (noteWithUpdatedOrder.orderIndex = i)
    );
    notes = notesWithUpdatedOrder;
    if (persist) {
      // TODO db
    }
  };

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
</script>

<div class="notescontainer">
  <div class="notescontainerheader">Notizen</div>
  <div
    class="notescontainercontent"
    use:dndzone={{
      items: notes,
      flipDurationMs,
      dropTargetStyle: { outline: "" },
    }}
    on:consider={(e) => onNoteOrderUpdated(e.detail.items)}
    on:finalize={(e) => onNoteOrderUpdated(e.detail.items, true)}
  >
    {#each notes as note (note.id)}
      <div animate:flip={{ duration: flipDurationMs }}>
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
