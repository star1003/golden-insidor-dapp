<template>
  <Modal :active="active" @close="handleCancel">
    <div
      class=""
      id="staticBackdrop4"
      data-mdb-backdrop="static"
      data-mdb-keyboard="false"
      tabindex="-1"
      aria-labelledby="staticBackdropLabel"
      >
      <div class="modal-dialog-centered model-width1">
        <div class="">
            <h2 class="text-center d-block textb border-bottom mt-4">
              {{title}}
            </h2>
            <div class="modal-body pt-0" :style="'max-height: 700px; overflow-x: auto;'">
              <div v-for="(field, index) in fields" :key="field.name" class="form mb-3 text-left">
                  <label class="mb-2">
                    {{field.label}}
                  </label>
                  <textarea v-if="field.type == 'textarea'" v-model="field.model" class="form-control" :style="field.style"></textarea>
                  <input :key="index" :ref="`inputbtn-${index}`" v-else v-model="field.model" type="text" class="form-control" @input="onChange($event, index)" :placeholder="field.placeholder || ''" :style="field.style"/>
                  <!-- <input v-else v-model="field.model" type="text" class="form-control" :placeholder="field.placeholder || ''" :style="field.style"/> -->
              </div>
            </div>
            <div class="d-flex justify-content-between flex-wrap align-content-center mt-2 p-2">
                <div class="col-xl-6 col-6 text-center">
                  <a @click="handleCancel" class="btn btn-outline-black d-block me-2" data-mdb-dismiss="modal">{{btnCancel}}</a>
                </div>
                <div class="col-xl-6 col-6 d-flex text-center">
                  <a @click="handleOk" class="btn btn-black d-block w-100 ms-2">{{btnOk}}</a>
                </div>
            </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
// @ is an alias to /src
import { mapGetters } from "vuex";
import Modal from './Modal.vue';
import Web3 from '@/helpers/Web3';
export default {
  name: "InputModal",
  props: {
    callback: {},
    active: {
      type: Boolean
    },
    fields: {
      type: Array
    },
    hasCopy: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String
    },
    btnCancel: {
      type: String,
      default: 'No'
    },
    btnOk: {
      type: String,
      default: 'Yes'
    }
  },
  components: {
    Modal
  },
  computed: {
    ...mapGetters({
    }),
  },
  watch: {
  },
  beforeDestroy() {
  },
  async mounted() {
  },
  methods: {
    onChange (event, index) {
      const selectedObject = this.fields[index];
      selectedObject.model.trim().split(" ").map((newValue, st) =>{
        const curObject = this.fields[index+st];
        curObject.model = newValue;  
      });
    },
    handleCancel() {
      this.$emit('cancel');
    },
    getLevel() {
      return Web3.getLevel(); 
    },
    handleOk() {
      if (this.callback) {
        this.callback();
      } else {
        this.$emit('ok');
      }
    },
    async copyClipboard() {
      const text = await navigator.clipboard.readText();
      const addresses = text.match(/(\b0x[a-fA-F0-9]{40}\b)/g)
      for (let i = 0; i < this.fields.length; i++) {
        this.fields[i].model = addresses[i];
      }
      console.log(this.fields, addresses)
    }
  },
  data() {
    return {
    };
  },
};
</script>

<style scoped>
</style>