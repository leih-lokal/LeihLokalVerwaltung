<script>
    import PopupFormularConfiguration from "../../Input/PopupFormularConfiguration";
    import InputTypes from "../../Input/InputTypes";
    import PopupFormular from "../../Input/PopupFormular.svelte";
    import { itemDb, keyValueStore } from "../../../utils/stores";
    import { notifier } from "@beyonk/svelte-notifications";
    import WoocommerceClient from "ENV_WC_CLIENT";
    import { getContext } from "svelte";

    const { close } = getContext("simple-modal");

    const woocommerceClient = new WoocommerceClient();

    export let createNew;

    if (createNew) {
        keyValueStore.setValue("currentDoc", {
            added: new Date().getTime(),
            status_on_website: "instock",
        });
        $itemDb.nextUnusedId().then((id) =>
            keyValueStore.setValue("currentDoc", {
                ...$keyValueStore["currentDoc"],
                _id: String(id),
            })
        );
    }

    const popupFormularConfiguration = new PopupFormularConfiguration()
        .setTitle(`Gegenstand ${createNew ? "anlegen" : "bearbeiten"}`)
        .setDisplayDeleteButton(!createNew)
        .setInputGroups([
            "Bezeichnung",
            "Eigenschaften",
            "Zubehör",
            "Bild",
            "Status",
        ])
        .setInputs([
            {
                id: "item_id",
                label: "Gegenstand Nr",
                group: "Bezeichnung",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "_id" },
            },
            {
                id: "item_name",
                label: "Gegenstand Name",
                group: "Bezeichnung",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "item_name" },
            },
            {
                id: "brand",
                label: "Marke",
                group: "Bezeichnung",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "brand" },
            },
            {
                id: "itype",
                label: "Typbezeichnung",
                group: "Bezeichnung",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "itype" },
            },

            {
                id: "category",
                label: "Kategorie",
                group: "Eigenschaften",
                type: InputTypes.SELECTION,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "category" },
                selectionOptions: [
                    "Küche",
                    "Haushalt",
                    "Garten",
                    "Kinder",
                    "Freizeit",
                    "Heimwerker",
                ],
                isCreatable: false,
                isMulti: true,
                isClearable: true,
            },
            {
                id: "deposit",
                label: "Pfand",
                group: "Eigenschaften",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "deposit" },
            },
            {
                id: "added",
                label: "Erfasst am",
                group: "Eigenschaften",
                type: InputTypes.DATE,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "added" },
            },
            {
                id: "properties",
                label: "Eigenschaften",
                group: "Eigenschaften",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "properties" },
            },

            {
                id: "parts",
                label: "Anzahl Teile",
                group: "Zubehör",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "parts" },
            },
            {
                id: "manual",
                label: "Anleitung",
                group: "Zubehör",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "manual" },
            },
            {
                id: "package",
                label: "Verpackung",
                group: "Zubehör",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "package" },
            },

            {
                id: "image",
                label: "Bild",
                group: "Bild",
                type: InputTypes.TEXT,
                bindTo: { keyValueStoreKey: "currentDoc", attr: "image" },
            },

            {
                id: "status_on_website",
                label: "Status auf Webseite",
                group: "Status",
                type: InputTypes.SELECTION,
                bindTo: {
                    keyValueStoreKey: "currentDoc",
                    attr: "status_on_website",
                },
                selectionOptions: [
                    { value: "deleted", label: "gelöscht" },
                    { value: "instock", label: "verfügbar" },
                    { value: "outofstock", label: "verliehen" },
                ],
                isCreatable: false,
                isMulti: false,
                isClearable: false,
            },
        ]);
</script>

<PopupFormular
    {popupFormularConfiguration}
    on:delete={(event) => {
        const doc = $keyValueStore['currentDoc'];
        if (confirm('Soll dieser Gegenstand wirklich gelöscht werden?')) {
            $itemDb
                .removeDoc(doc)
                .then(() => notifier.success('Gegenstand gelöscht!'))
                .then(close)
                .catch((error) => {
                    console.error(error);
                    notifier.danger('Gegenstand konnte nicht gelöscht werden!', 6000);
                });
        }
    }}
    on:save={async (event) => {
        const doc = $keyValueStore['currentDoc'];
        const savePromise = createNew ? $itemDb.createDoc(doc) : $itemDb.updateDoc(doc);
        await savePromise
            .then((result) => notifier.success('Gegenstand gespeichert!'))
            .then(close)
            .catch((error) => {
                notifier.danger('Gegenstand konnte nicht gespeichert werden!', 6000);
                console.error(error);
            });

        if (createNew) {
            woocommerceClient
                .createItem(doc)
                .then((wcDoc) => {
                    doc.wc_url = wcDoc.permalink;
                    doc.wc_id = wcDoc.id;
                    console.log(doc);
                    $itemDb.updateDoc(doc);
                    notifier.success('Gegenstand auf der Webseite erstellt!', 3000);
                })
                .catch((error) => {
                    notifier.warning('Gegenstand konnte auf der Webseite nicht erstellt werden!', 6000);
                    console.error(error);
                });
        } else {
            woocommerceClient
                .updateItem(doc)
                .then(() =>
                    notifier.success(
                        'Status auf der Webseite aktualisiert!',
                        3000
                    )
                )
                .catch((error) => {
                    notifier.warning('Status auf der Webseite konnte nicht aktualisiert werden!', 6000);
                    console.error(error);
                });
        }
    }}
    on:cancel={close} />
