import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://apicompras.daemlu.cl');

// Disable auto cancellation
pb.autoCancellation(false);

export default pb;
