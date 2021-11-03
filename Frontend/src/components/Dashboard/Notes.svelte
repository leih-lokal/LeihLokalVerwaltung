<script>
  import { flip } from "svelte/animate";
  import { v4 as uuidv4 } from "uuid";
  import Note from "./Note.svelte";
  import AddNote from "./AddNote.svelte";
  import Database from "../../database/ENV_DATABASE";
  import { onDestroy, onMount } from "svelte";
  import Logger from "js-logger";
  import { notifier } from "@beyonk/svelte-notifications";

  const colors = [
    "#ffd8c0",
    "#a1f5cf",
    "#f1bff4",
    "#d9bafd",
    "#a4e2fb",
    "#fdb7b8",
  ];

  const flipDurationMs = 300;
  const docType = "note";

  const randomColor = () => colors[Math.floor(Math.random() * colors.length)];

  let notes = [];

  const loadNotesFromDatabase = (forceRefreshCache = false) =>
    Database.fetchByType("note", forceRefreshCache)
      .then(
        (result) =>
          (notes = result.sort(
            (noteA, noteB) => noteA.orderIndex - noteB.orderIndex
          ))
      )
      .catch((error) => {
        Logger.error(`Failed to load notes`, error);
        notifier.danger("Notizen konnten nicht geladen werden!", {
          persist: true,
        });
      });

  onMount(() => {
    loadNotesFromDatabase().then(() =>
      Database.listenForChanges(() => loadNotesFromDatabase(true), docType)
    );
  });

  onDestroy(() => {
    Database.cancelListenerForDocType(docType);
  });

  const initializeNode = () => ({
    _id: uuidv4(),
    contentHtml: "",
    timestamp: new Date().getTime(),
    backgroundColor: randomColor(),
    orderIndex: Math.min(notes.map((note) => note.orderIndex)) - 1,
    type: "note",
  });

  const onAddNodeButtonClicked = () => {
    const newNote = initializeNode();
    notes = [newNote, ...notes];
    Database.createDoc(newNote)
      .then((response) => (newNote._rev = response.rev))
      .catch((error) => {
        Logger.error(`Failed to create note ${newNote._id}`, error);
        notifier.danger("Notiz konnte nicht gespeichert werden!", {
          persist: true,
        });
      });
  };

  const onNoteDeleted = (noteId) => {
    const noteToRemove = notes.find((note) => note._id === noteId);
    notes = notes.filter((note) => note._id !== noteId);
    Database.removeDoc(noteToRemove).catch((error) => {
      Logger.error(`Failed to remove note ${noteId}`, error);
      notifier.danger("Notiz konnte nicht gelöscht werden!", {
        persist: true,
      });
    });
  };

  const onNoteChanged = (noteId, changedContentHtml) => {
    const note = notes.find((note) => note._id === noteId);
    note.timestamp = new Date().getTime();
    note.contentHtml = changedContentHtml;
    notes = [...notes];
    Database.updateDoc(note, false)
      .then((response) => (note._rev = response.rev))
      .catch((error) => {
        Logger.error(`Failed to save note ${noteId}`, error);
        notifier.danger("Notiz konnte nicht gespeichert werden!", {
          persist: true,
        });
      });
  };

  const onNoteDrop = (event, dragEndIndex) => {
    event.dataTransfer.dropEffect = "move";
    const dragStartIndex = parseInt(event.dataTransfer.getData("text/plain"));
    if (dragStartIndex !== dragEndIndex) {
      const draggedNote = notes[dragStartIndex];
      notes[dragStartIndex] = notes[dragEndIndex];
      notes[dragEndIndex] = draggedNote;
      notes.forEach((note, i) => (note.orderIndex = i));
      notes = [...notes];
      // TODO: improve, reduce db updates
      notes.forEach((note) => Database.updateDoc(note));
    }
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
    {#each notes as note, index (note._id)}
      <div animate:flip={{ duration: flipDurationMs }}>
        <Note
          id={note._id}
          contentHtml={note.contentHtml}
          timestamp={note.timestamp}
          backgroundColor={note.backgroundColor}
          on:delete={(e) => onNoteDeleted(note._id)}
          on:change={(e) => onNoteChanged(note._id, e.detail)}
          on:dragstart={(event) => onNoteDragStart(event, index)}
          on:drop={(event) => onNoteDrop(event, index)}
        />
      </div>
    {/each}
    <AddNote on:click={onAddNodeButtonClicked} />
  </div>
</div>

<style>
  .notescontainer {
    display: flex;
    flex-direction: column;
    background-color: white;
    --note-width: 24rem;
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
